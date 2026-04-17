'use client';

import React, { useRef, useId, useEffect, CSSProperties } from 'react';

interface ResponsiveImage {
    src: string;
    alt?: string;
    srcSet?: string;
}

interface AnimationConfig {
    preview?: boolean;
    scale: number;
    speed: number;
}

interface NoiseConfig {
    opacity: number;
    scale: number;
}

interface ShadowOverlayProps {
    type?: 'preset' | 'custom';
    presetIndex?: number;
    customImage?: ResponsiveImage;
    sizing?: 'fill' | 'stretch';
    color?: string;
    animation?: AnimationConfig;
    noise?: NoiseConfig;
    style?: CSSProperties;
    className?: string;
}

function mapRange(
    value: number,
    fromLow: number,
    fromHigh: number,
    toLow: number,
    toHigh: number
): number {
    if (fromLow === fromHigh) return toLow;
    const percentage = (value - fromLow) / (fromHigh - fromLow);
    return toLow + percentage * (toHigh - toLow);
}

const useInstanceId = (): string => {
    const id = useId();
    return `shadowoverlay-${id.replace(/:/g, "")}`;
};

// How many times per second the SVG filter hue value is updated.
// Lower = less GPU/CPU work. 30 is imperceptible for a slow ambient blob.
const FILTER_UPDATE_FPS = 30;
const FILTER_INTERVAL_MS = 1000 / FILTER_UPDATE_FPS;

export function Component({
    sizing = 'fill',
    color = 'rgba(128, 128, 128, 1)',
    animation,
    noise,
    style,
    className
}: ShadowOverlayProps) {
    const id = useInstanceId();

    const [isMobile, setIsMobile] = React.useState(false);
    const feColorMatrixRef = useRef<SVGFEColorMatrixElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsMobile(window.matchMedia("(pointer: coarse)").matches);
    }, []);

    const animationEnabled = !isMobile && !!(animation && animation.scale > 0);
    const displacementScale = animation ? mapRange(animation.scale, 1, 100, 20, 100) : 0;
    const animationDuration = animation ? mapRange(animation.speed, 1, 100, 1000, 50) : 1;

    useEffect(() => {
        if (!animationEnabled || !feColorMatrixRef.current) return;

        const cycleDurationMs = (animationDuration / 25) * 1000;

        let rafId: number;
        let lastUpdateMs = 0;
        let isVisible = true;
        let isTabVisible = document.visibilityState === "visible";

        function tick(nowMs: number) {
            rafId = requestAnimationFrame(tick);
            if (!isVisible || !isTabVisible) return;
            if (nowMs - lastUpdateMs < FILTER_INTERVAL_MS) return;
            lastUpdateMs = nowMs;
            const hue = (nowMs / cycleDurationMs * 360) % 360;
            feColorMatrixRef.current?.setAttribute("values", String(hue));
        }

        rafId = requestAnimationFrame(tick);

        const io = new IntersectionObserver(([entry]) => {
            isVisible = entry.isIntersecting;
        });
        if (containerRef.current) io.observe(containerRef.current);

        function onVisibilityChange() {
            isTabVisible = document.visibilityState === "visible";
        }
        document.addEventListener("visibilitychange", onVisibilityChange);

        return () => {
            cancelAnimationFrame(rafId);
            io.disconnect();
            document.removeEventListener("visibilitychange", onVisibilityChange);
        };
    }, [animationEnabled, animationDuration]);

    // Mobile: lightweight static gradient — no SVG filters, fully GPU-composited.
    if (isMobile) {
        return (
            <div
                className={className}
                style={{ overflow: "hidden", position: "relative", width: "100%", height: "100%", ...style }}
            >
                <div style={{
                    position: "absolute",
                    inset: 0,
                    background: `radial-gradient(ellipse 85% 65% at 38% 44%, ${color}, transparent)`,
                    opacity: 0.85,
                }} />
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={className}
            style={{
                overflow: "hidden",
                position: "relative",
                width: "100%",
                height: "100%",
                ...style
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: -displacementScale,
                    filter: animationEnabled ? `url(#${id}) blur(4px)` : "none",
                    // Promote to its own compositing layer so filter updates
                    // don't force a repaint of surrounding content.
                    willChange: animationEnabled ? "filter" : "auto",
                }}
            >
                {animationEnabled && (
                    <svg style={{ position: "absolute" }}>
                        <defs>
                            <filter id={id} colorInterpolationFilters="sRGB">
                                <feTurbulence
                                    result="undulation"
                                    numOctaves="2"
                                    baseFrequency={`${mapRange(animation.scale, 0, 100, 0.001, 0.0005)},${mapRange(animation.scale, 0, 100, 0.004, 0.002)}`}
                                    seed="0"
                                    type="turbulence"
                                />
                                <feColorMatrix
                                    ref={feColorMatrixRef}
                                    in="undulation"
                                    type="hueRotate"
                                    values="180"
                                />
                                <feColorMatrix
                                    in="dist"
                                    result="circulation"
                                    type="matrix"
                                    values="4 0 0 0 1  4 0 0 0 1  4 0 0 0 1  1 0 0 0 0"
                                />
                                <feDisplacementMap
                                    in="SourceGraphic"
                                    in2="circulation"
                                    scale={displacementScale}
                                    result="dist"
                                />
                                <feDisplacementMap
                                    in="dist"
                                    in2="undulation"
                                    scale={displacementScale}
                                    result="output"
                                />
                            </filter>
                        </defs>
                    </svg>
                )}
                <div
                    style={{
                        backgroundColor: color,
                        maskImage: `url('https://framerusercontent.com/images/ceBGguIpUU8luwByxuQz79t7To.png')`,
                        maskSize: sizing === "stretch" ? "100% 100%" : "cover",
                        maskRepeat: "no-repeat",
                        maskPosition: "center",
                        width: "100%",
                        height: "100%"
                    }}
                />
            </div>

            {noise && noise.opacity > 0 && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: `url("https://framerusercontent.com/images/g0QcWrxr87K0ufOxIUFBakwYA8.png")`,
                        backgroundSize: noise.scale * 200,
                        backgroundRepeat: "repeat",
                        opacity: noise.opacity / 2
                    }}
                />
            )}
        </div>
    );
}
