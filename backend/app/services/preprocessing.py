
import cv2
import numpy as np
import os
from loguru import logger
from backend.app.core.config import settings

class ImagePreprocessor:
    @staticmethod
    def load_image(file_path: str) -> np.ndarray:
        image = cv2.imread(file_path)
        if image is None:
            raise ValueError(f"Could not load image at {file_path}")
        return image

    @staticmethod
    def preprocess(image: np.ndarray, debug_output_dir: str = None) -> np.ndarray:
        """
        Applies a standard pipeline: Grayscale -> Denoise -> Threshold -> Edge Detection
        """
        if not settings.ENABLE_PREPROCESSING:
            return image

        # 1. Grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        if debug_output_dir:
            cv2.imwrite(os.path.join(debug_output_dir, "step_1_gray.png"), gray)

        # 2. Denoise (Gaussian Blur)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # 3. Adaptive Thresholding (good for shadows/uneven lighting)
        thresh = cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2
        )
        if debug_output_dir:
            cv2.imwrite(os.path.join(debug_output_dir, "step_3_thresh.png"), thresh)

        # 4. Morphological operations to close gaps
        kernel = np.ones((3,3), np.uint8)
        closing = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=1) # Close small holes
        
        # 5. Canny Edge Detection (Optional, mostly for shape detection later)
        edges = cv2.Canny(blurred, 50, 150)
        if debug_output_dir:
            cv2.imwrite(os.path.join(debug_output_dir, "step_5_edges.png"), edges)
            
        return closing # Returning the binary image for OCR/Shape detection

    @staticmethod
    def save_debug_image(image: np.ndarray, path: str):
        cv2.imwrite(path, image)
