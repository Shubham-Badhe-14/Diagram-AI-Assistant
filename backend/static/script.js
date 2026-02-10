
document.addEventListener('DOMContentLoaded', () => {
    mermaid.initialize({ startOnLoad: false, theme: 'default' });

    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const previewContainer = document.getElementById('preview-container');
    const imagePreview = document.getElementById('image-preview');
    const processBtn = document.getElementById('process-btn');

    const uploadSection = document.getElementById('upload-section');
    const progressSection = document.getElementById('progress-section');
    const resultSection = document.getElementById('result-section');
    const statusText = document.getElementById('status-text');

    const mermaidOutput = document.getElementById('mermaid-output');
    const mermaidCode = document.getElementById('mermaid-code');
    const serverRenderStatus = document.getElementById('server-render-status');
    const downloadPngBtn = document.getElementById('download-png-btn');
    const downloadMmdBtn = document.getElementById('download-mmd-btn');
    const newBtn = document.getElementById('new-btn');
    const errorToast = document.getElementById('error-toast');
    const errorMessage = document.getElementById('error-message');

    let currentJobId = null;

    // --- Upload Handling ---

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
            handleFile(fileInput.files[0]);
        }
    });

    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            showError('Please upload an image file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            previewContainer.classList.remove('hidden');
        };
        reader.readAsDataURL(file);

        // Store file for upload
        fileInput.fileToUpload = file;
    }

    // --- API Interactions ---

    processBtn.addEventListener('click', async () => {
        const file = fileInput.fileToUpload;
        if (!file) return;

        setStep('processing');

        const formData = new FormData();
        formData.append('file', file);

        try {
            // 1. Upload
            statusText.textContent = "Uploading image...";
            const uploadRes = await fetch('/api/v1/upload', {
                method: 'POST',
                body: formData
            });

            if (!uploadRes.ok) throw new Error('Upload failed');
            const uploadData = await uploadRes.json();
            currentJobId = uploadData.job_id;

            // 2. Start Processing
            statusText.textContent = "Initializing intelligence...";
            const processRes = await fetch(`/api/v1/process/${currentJobId}`, {
                method: 'POST'
            });
            if (!processRes.ok) throw new Error('Processing start failed');

            // 3. Poll Status
            pollStatus(currentJobId);

        } catch (err) {
            console.error(err);
            showError(err.message);
            setStep('upload');
        }
    });

    async function pollStatus(jobId) {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/v1/status/${jobId}`);
                if (!res.ok) throw new Error('Status check failed');
                const data = await res.json();

                statusText.textContent = `Status: ${data.status.replace('_', ' ')}...`;

                if (data.status === 'completed' || data.status === 'completed_with_warnings') {
                    clearInterval(interval);
                    fetchResults(jobId);
                } else if (data.status.startsWith('failed')) {
                    clearInterval(interval);
                    showError(`Processing failed: ${data.status}`);
                    setStep('upload');
                }
            } catch (err) {
                clearInterval(interval);
                showError(err.message);
                setStep('upload'); // Reset on serious error
            }
        }, 1000);
    }

    async function fetchResults(jobId) {
        try {
            // Get Mermaid Code
            const mmdRes = await fetch(`/api/v1/results/${jobId}/mermaid`);
            if (!mmdRes.ok) throw new Error('Failed to fetch result code');
            const mmdCode = await mmdRes.text();

            mermaidCode.value = mmdCode;

            // Client-side render
            mermaidOutput.innerHTML = mmdCode;
            await mermaid.run({
                nodes: [mermaidOutput]
            });

            // Check if server-side PNG exists (it won't because we don't have mermaid-cli)
            const pngRes = await fetch(`/api/v1/results/${jobId}/png`, { method: 'HEAD' });
            if (pngRes.ok) {
                serverRenderStatus.textContent = "Available (Download PNG works)";
                serverRenderStatus.className = "text-green-600 font-bold";
            } else {
                serverRenderStatus.textContent = "Unavailable (Server missing mermaid-cli)";
                serverRenderStatus.className = "text-orange-600 font-bold";
            }

            setStep('result');

        } catch (err) {
            console.error(err);
            showError("Could not render results. " + err.message);
        }
    }

    // --- Downloads ---

    downloadMmdBtn.addEventListener('click', () => {
        if (!currentJobId) return;
        window.open(`/api/v1/results/${currentJobId}/mermaid`, '_blank');
    });

    downloadPngBtn.addEventListener('click', () => {
        if (!currentJobId) return;
        // Try server download first
        fetch(`/api/v1/results/${currentJobId}/png`, { method: 'HEAD' })
            .then(res => {
                if (res.ok) {
                    window.open(`/api/v1/results/${currentJobId}/png`, '_blank');
                } else {
                    showError("Server-side PNG not available. Use screenshot for now.");
                }
            });
    });

    newBtn.addEventListener('click', () => {
        setStep('upload');
        fileInput.value = '';
        fileInput.fileToUpload = null;
        imagePreview.src = '#';
        previewContainer.classList.add('hidden');
        mermaidOutput.innerHTML = '';
        mermaidCode.value = '';
    });


    // --- Helpers ---

    function setStep(step) {
        uploadSection.classList.add('hidden');
        progressSection.classList.add('hidden');
        resultSection.classList.add('hidden');

        if (step === 'upload') uploadSection.classList.remove('hidden');
        if (step === 'processing') progressSection.classList.remove('hidden');
        if (step === 'result') resultSection.classList.remove('hidden');
    }

    function showError(msg) {
        errorMessage.textContent = msg;
        errorToast.classList.remove('hidden');
        setTimeout(() => errorToast.classList.add('hidden'), 5000);
    }
});
