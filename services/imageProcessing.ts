
export const removeBackground = async (imageUrl: string, mode: 'white' | 'green' | 'black'): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width; canvas.height = img.height;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0);
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height);

            for (let i = 0; i < data.data.length; i += 4) {
                const r = data.data[i];
                const g = data.data[i + 1];
                const b = data.data[i + 2];

                if (mode === 'white') {
                    // White removal (approximate) - tuned for "pure white" isolation
                    // We check if all channels are very high, with some tolerance for off-white
                    if (r > 220 && g > 220 && b > 220) {
                        data.data[i + 3] = 0;
                    }
                } else if (mode === 'green') {
                    // Green screen detection - improved to be more selective
                    if (g > 100 && g > r * 1.1 && g > b * 1.1) {
                        data.data[i + 3] = 0;
                    }
                } else if (mode === 'black') {
                    // Black background removal
                    if (r < 40 && g < 40 && b < 40) {
                        data.data[i + 3] = 0;
                    }
                }
            }
            ctx.putImageData(data, 0, 0);
            resolve(canvas.toDataURL());
        };
        img.onerror = reject;
    });
};

export const erodeImage = async (imageUrl: string, amount: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width; canvas.height = img.height;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const oldData = imageData.data;
            const newData = new Uint8ClampedArray(oldData);
            const w = canvas.width;
            const h = canvas.height;

            // Simple Morphological Erode (Shrink) / Dilate (Grow) logic
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const idx = (y * w + x) * 4;
                    // const isTransparent = oldData[idx + 3] === 0; // Not used currently but good to know

                    let neighborTransparent = false;
                    let neighborOpaque = false;

                    // Check 4-connected neighbors
                    const checkNeighbor = (nx: number, ny: number) => {
                        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                            const nIdx = (ny * w + nx) * 4;
                            if (oldData[nIdx + 3] === 0) {
                                neighborTransparent = true;
                            } else {
                                neighborOpaque = true;
                            }
                        }
                    };

                    checkNeighbor(x - 1, y);
                    checkNeighbor(x + 1, y);
                    checkNeighbor(x, y - 1);
                    checkNeighbor(x, y + 1);

                    if (amount > 0) { // Erode (shrink) - remove opaque pixels near transparency
                        if (oldData[idx + 3] > 0 && neighborTransparent) {
                            newData[idx + 3] = 0;
                        }
                    } else if (amount < 0) { // Dilate (grow) - ADD opaque pixels near opaque
                        // Not strictly implemented for "Undo" logic, but as a generic tool:
                        if (oldData[idx + 3] === 0 && neighborOpaque) {
                            // Fill with average color of neighbors? Or just black/white? 
                            // For now, dilate is risky without color context. 
                            // But since we use amount < 0 for Undo/Reset in the UI, this branch might be unused 
                            // unless we actually want "Grow". 
                            // Let's keep it safe: just return if someone tries to use it.
                        }
                    }
                }
            }
            // Apply changes
            imageData.data.set(newData);
            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL());
        };
        img.onerror = reject;
    });
};

export const createToken = async (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const size = Math.min(img.width, img.height);
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d')!;

            // Center image crop
            const offsetX = (img.width - size) / 2;
            const offsetY = (img.height - size) / 2;

            // 1. Drop Shadow for the token
            ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 4;
            ctx.shadowOffsetY = 4;

            // 2. Create circular Path
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, (size / 2) - 4, 0, Math.PI * 2, true); // -4 buffer for slight margin
            ctx.closePath();

            ctx.save();
            ctx.clip();
            // Draw image inside circle
            ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size);
            ctx.restore();

            // 3. Draw Gold Ring Border
            const gradient = ctx.createLinearGradient(0, 0, size, size);
            gradient.addColorStop(0, '#FFD700');
            gradient.addColorStop(0.25, '#FDB931');
            gradient.addColorStop(0.5, '#DAA520');
            gradient.addColorStop(0.75, '#B8860B');
            gradient.addColorStop(1, '#FFD700');

            ctx.beginPath();
            ctx.arc(size / 2, size / 2, (size / 2) - 10, 0, Math.PI * 2, true); // Main ring
            ctx.lineWidth = 12;
            ctx.strokeStyle = gradient;
            ctx.stroke();

            // Inner highlight
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, (size / 2) - 16, 0, Math.PI * 2, true);
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.stroke();

            // Outer dark rim
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, (size / 2) - 4, 0, Math.PI * 2, true);
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.stroke();

            resolve(canvas.toDataURL());
        };
        img.onerror = reject;
    });
};

export const downloadImage = async (url: string, filename: string) => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
        console.error("Błąd pobierania:", e);
        window.open(url, '_blank');
    }
};

export const sliceSpriteSheet = async (imageUrl: string, rows: number, cols: number): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageUrl;
        img.onload = () => {
            const frames: string[] = [];
            const fw = img.width / cols;
            const fh = img.height / rows;
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    const canvas = document.createElement('canvas');
                    canvas.width = fw;
                    canvas.height = fh;
                    const ctx = canvas.getContext('2d')!;
                    ctx.drawImage(img, x * fw, y * fh, fw, fh, 0, 0, fw, fh);

                    // Trimming: check if frame is not empty
                    const data = ctx.getImageData(0, 0, fw, fh);
                    let hasContent = false;
                    for (let i = 3; i < data.data.length; i += 4) {
                        if (data.data[i] > 10) { hasContent = true; break; }
                    }
                    if (hasContent) frames.push(canvas.toDataURL());
                }
            }
            resolve(frames);
        };
        img.onerror = reject;
    });
};

export const detectFrames = async (imageUrl: string): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width; canvas.height = img.height;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0);
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const { width, height } = canvas;
            const pixels = data.data;

            // Check if image is opaque (like JPG)
            let isOpaque = true;
            for (let i = 3; i < pixels.length; i += 40) { // Sample check
                if (pixels[i] < 200) { isOpaque = false; break; }
            }

            // If opaque, detect background color from corners
            let bgR = 0, bgG = 0, bgB = 0;
            if (isOpaque) {
                const corners = [0, (width - 1) * 4, (height - 1) * width * 4, (pixels.length - 4)];
                corners.forEach(idx => {
                    bgR += pixels[idx]; bgG += pixels[idx + 1]; bgB += pixels[idx + 2];
                });
                bgR /= 4; bgG /= 4; bgB /= 4;
            }

            const visited = new Uint8Array(width * height);
            const frames: string[] = [];

            const isSolid = (x: number, y: number) => {
                const idx = (y * width + x) * 4;
                if (!isOpaque) return pixels[idx + 3] > 20;

                // For opaque: check if significantly different from background (chroma key detection)
                const r = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2];
                const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
                return diff > 50; // Threshold for content
            };

            for (let y = 0; y < height; y += 8) { // Step for speed
                for (let x = 0; x < width; x += 8) {
                    const idx = y * width + x;
                    if (!visited[idx] && isSolid(x, y)) {
                        let minX = x, maxX = x, minY = y, maxY = y;
                        const stack = [[x, y]];
                        visited[idx] = 1;

                        while (stack.length > 0) {
                            const [cx, cy] = stack.pop()!;
                            if (cx < minX) minX = cx; if (cx > maxX) maxX = cx;
                            if (cy < minY) minY = cy; if (cy > maxY) maxY = cy;

                            // Dynamic neighbors for island hopping
                            const neighbors = [[cx + 16, cy], [cx - 16, cy], [cx, cy + 16], [cx, cy - 16], [cx + 16, cy + 16], [cx - 16, cy - 16]];
                            for (const [nx, ny] of neighbors) {
                                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                    const nIdx = ny * width + nx;
                                    if (!visited[nIdx] && isSolid(nx, ny)) {
                                        visited[nIdx] = 1;
                                        stack.push([nx, ny]);
                                    }
                                }
                            }
                        }

                        // Pad bounding box
                        minX = Math.max(0, minX - 15);
                        minY = Math.max(0, minY - 15);
                        maxX = Math.min(width - 1, maxX + 15);
                        maxY = Math.min(height - 1, maxY + 15);

                        // Only if big enough
                        if (maxX - minX > width * 0.05 && maxY - minY > height * 0.05) {
                            const fCanvas = document.createElement('canvas');
                            fCanvas.width = maxX - minX;
                            fCanvas.height = maxY - minY;
                            const fCtx = fCanvas.getContext('2d')!;
                            fCtx.drawImage(img, minX, minY, fCanvas.width, fCanvas.height, 0, 0, fCanvas.width, fCanvas.height);

                            // If it was opaque, we should make the detected background transparent in the frame
                            if (isOpaque) {
                                const fData = fCtx.getImageData(0, 0, fCanvas.width, fCanvas.height);
                                for (let i = 0; i < fData.data.length; i += 4) {
                                    const r = fData.data[i], g = fData.data[i + 1], b = fData.data[i + 2];
                                    const d = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
                                    if (d < 60) { // Slight tolerance for background removal
                                        fData.data[i + 3] = 0;
                                    }
                                }
                                fCtx.putImageData(fData, 0, 0);
                            }

                            frames.push(fCanvas.toDataURL());
                        }
                    }
                }
            }
            resolve(frames);
        };
        img.onerror = reject;
    });
};
