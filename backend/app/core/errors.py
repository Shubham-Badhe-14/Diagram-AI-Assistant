
class AppError(Exception):
    """Base exception for application errors."""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class StorageError(AppError):
    """Raised when file storage operations fail."""
    def __init__(self, message: str):
        super().__init__(message, status_code=500)

class ValidationError(AppError):
    """Raised when input validation fails."""
    def __init__(self, message: str):
        super().__init__(message, status_code=400)

class OCRFailure(AppError):
    """Raised when OCR extraction fails."""
    def __init__(self, message: str = "Text extraction failed"):
        super().__init__(message, status_code=500)

class VisionFailure(AppError):
    """Raised when AI Vision analysis fails."""
    def __init__(self, message: str = "Diagram analysis failed"):
        super().__init__(message, status_code=502)

class GraphBuildFailure(AppError):
    """Raised when structure inference fails."""
    def __init__(self, message: str = "Could not build diagram structure"):
        super().__init__(message, status_code=422)

class MermaidSyntaxError(AppError):
    """Raised when generated Mermaid code is invalid."""
    pass

class RenderFailed(AppError):
    """Raised when Mermaid CLI fails to render."""
    def __init__(self, message: str = "Image rendering failed"):
        super().__init__(message, status_code=500)
