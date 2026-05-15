/** Returns the sub-rect where video content appears inside a container,
 *  assuming object-fit: contain (letterboxed to maintain aspect ratio). */
export function videoContentRect(
    containerW: number, containerH: number,
    videoW: number, videoH: number,
): { x: number; y: number; w: number; h: number } {
    if (!videoW || !videoH) return { x: 0, y: 0, w: containerW, h: containerH };
    const containerAspect = containerW / containerH;
    const videoAspect = videoW / videoH;
    if (videoAspect > containerAspect) {
        const w = containerW;
        const h = containerW / videoAspect;
        return { x: 0, y: (containerH - h) / 2, w, h };
    } else {
        const h = containerH;
        const w = containerH * videoAspect;
        return { x: (containerW - w) / 2, y: 0, w, h };
    }
}
