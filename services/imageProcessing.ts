
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
                    frames.push(canvas.toDataURL());
                }
            }
            resolve(frames);
        };
        img.onerror = reject;
    });
};
