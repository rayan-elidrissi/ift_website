"""Remove grid overlay from logo image using median filtering."""
import numpy as np
from PIL import Image
from scipy.ndimage import median_filter
import os
import sys

def remove_grid(input_path: str, output_path: str = None, size: int = 5):
    """
    Remove thin grid lines using median filter - preserves edges better than blur.
    """
    if output_path is None:
        base, ext = os.path.splitext(input_path)
        output_path = f"{base}_no_grid{ext}"

    img = Image.open(input_path).convert("RGB")
    arr = np.array(img)

    # Median filter per channel - removes thin lines (grid) while preserving logo edges
    filtered = np.zeros_like(arr)
    for c in range(3):
        filtered[:, :, c] = median_filter(arr[:, :, c], size=size, mode='reflect')

    out_img = Image.fromarray(filtered.astype(np.uint8))
    out_img.save(output_path)
    print(f"Saved: {output_path}")
    return output_path

if __name__ == "__main__":
    img_path = r"C:\Users\rayan\.cursor\projects\c-Users-rayan-OneDrive-Desktop-ift-website-versioning-v3-0-nopostgre\assets\c__Users_rayan_AppData_Roaming_Cursor_User_workspaceStorage_bbe2c1867a7b02e6a37a539df25fc237_images_image-107aa8e5-0120-413a-b7e5-7dd944e7e198.png"
    
    if len(sys.argv) > 1:
        img_path = sys.argv[1]
    elif not os.path.exists(img_path):
        print("Image not found at default path.")
        sys.exit(1)

    # Overwrite original with grid removed
    remove_grid(img_path, img_path, size=5)
