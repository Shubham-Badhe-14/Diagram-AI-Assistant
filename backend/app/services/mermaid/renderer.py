
import os
import shutil
import tempfile
import asyncio
from typing import Optional
from backend.app.core.config import settings
from backend.app.core.errors import RenderFailed, MermaidSyntaxError
from loguru import logger

class MermaidRenderer:
    def __init__(self):
        # Check if mmdc is in path
        self.mmdc_path = shutil.which("mmdc")
        if not self.mmdc_path:
            logger.warning("Mermaid CLI (mmdc) not found in PATH. Rendering will fail.")

    async def render(self, mermaid_code: str, output_format: str = "png") -> str:
        """
        Renders Mermaid code to an image file.
        Returns the path to the generated image.
        """
        if not self.mmdc_path:
            # Re-check in case it was installed later
            self.mmdc_path = shutil.which("mmdc")
            if not self.mmdc_path:
                raise RenderFailed("Mermaid CLI is not installed. Please install @mermaid-js/mermaid-cli.")

        if output_format not in ["png", "svg"]:
            raise ValueError("Unsupported output format. Use 'png' or 'svg'.")

        # validating syntax (basic check)
        if not mermaid_code.strip():
             raise MermaidSyntaxError("Mermaid code is empty.")

        # Create temp files
        with tempfile.NamedTemporaryFile(mode="w", suffix=".mmd", delete=False) as tmp_input:
            tmp_input.write(mermaid_code)
            input_path = tmp_input.name
        
        output_path = input_path.replace(".mmd", f".{output_format}")

        try:
            # Run mmdc
            # mmdc -i input.mmd -o output.png
            cmd = [self.mmdc_path, "-i", input_path, "-o", output_path]
            
            # Set background color to transparent or white if needed, default is clear
            if output_format == "png":
                cmd.extend(["-b", "transparent"])

            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                error_msg = stderr.decode().strip()
                logger.error(f"Mermaid CLI failed: {error_msg}")
                if "Syntax error" in error_msg:
                    raise MermaidSyntaxError(f"Syntax error in Mermaid code: {error_msg}")
                raise RenderFailed(f"Mermaid CLI failed: {error_msg}")
                
            if not os.path.exists(output_path):
                 raise RenderFailed("Mermaid CLI did not generate an output file.")

            return output_path

        except (MermaidSyntaxError, RenderFailed):
            raise
        except Exception as e:
            logger.error(f"Unexpected error during rendering: {e}")
            raise RenderFailed(str(e))
        finally:
            # Cleanup input file
            if os.path.exists(input_path):
                os.remove(input_path)
            # We explicitly do NOT remove output_path here, as it's the result. 
            # The caller handles it (e.g. moves it to job dir).

    @staticmethod
    def validate_syntax(mermaid_code: str) -> bool:
        # TODO: Implement stricter validation if needed
        return len(mermaid_code.strip()) > 0
