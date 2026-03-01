document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.querySelector('.browse-btn');
    const previewContainer = document.getElementById('previewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resetBtn = document.getElementById('resetBtn');
    const resultsContainer = document.getElementById('resultsContainer');
    const defectType = document.getElementById('defectType');
    const defectDescription = document.getElementById('defectDescription');
    const confidenceValue = document.getElementById('confidenceValue');
    const probabilityBars = document.getElementById('probabilityBars');
    const loadingOverlay = document.getElementById('loadingOverlay');

    // Defect descriptions for detailed results
    const defectDescriptions = {
        'crazing': 'Crazing defects appear as a network of fine cracks on the surface. These are typically caused by thermal stress or rapid cooling during manufacturing.',
        'inclusion': 'Inclusions are foreign particles embedded in the metal matrix. They can weaken the material and create stress concentration points.',
        'patches': 'Patches appear as areas with different surface textures or discoloration. They often result from uneven cooling or material inconsistencies.',
        'pitted_surface': 'Pitted surfaces show small crater-like depressions. These can be caused by corrosion, material removal, or gas entrapment during manufacturing.',
        'rolled-in_scale': 'Rolled-in scale occurs when oxide scale becomes embedded in the metal surface during the rolling process. This creates an uneven surface texture.',
        'scratches': 'Scratches are linear marks caused by contact with other objects during handling, processing, or transportation.'
    };

    // Event Listeners
    browseBtn.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', handleFileSelect);
    
    dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.classList.add('active');
    });
    
    dropArea.addEventListener('dragleave', () => {
        dropArea.classList.remove('active');
    });
    
    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.classList.remove('active');
        
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            handleFileSelect(e);
        }
    });
    
    analyzeBtn.addEventListener('click', analyzeImage);
    
    resetBtn.addEventListener('click', resetUI);

    // Functions
    function handleFileSelect(e) {
        const file = fileInput.files[0];
        
        if (file && file.type.match('image.*')) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                previewContainer.style.display = 'block';
                dropArea.style.display = 'none';
                resultsContainer.style.display = 'none';
            };
            
            reader.readAsDataURL(file);
        }
    }
    
    function analyzeImage() {
        // Show loading overlay
        loadingOverlay.style.display = 'flex';
        
        const file = fileInput.files[0];
        const formData = new FormData();
        
        if (file) {
            formData.append('file', file);
        } else {
            // If no file, try to use the image preview as base64
            const base64Image = imagePreview.src;
            if (base64Image && base64Image !== '#') {
                formData.append('image', base64Image);
            } else {
                alert('No image selected');
                loadingOverlay.style.display = 'none';
                return;
            }
        }
        
        fetch('/predict', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.detail || 'Server error');
                });
            }
            return response.json();
        })
        .then(data => {
            // Hide loading overlay
            loadingOverlay.style.display = 'none';
            
            // Display results
            displayResults(data);
        })
        .catch(error => {
            // Hide loading overlay
            loadingOverlay.style.display = 'none';
            alert('Error: ' + error.message);
        });
    }
    
    function displayResults(data) {
        // Show results container
        resultsContainer.style.display = 'block';
        
        // Update defect type
        const defectClass = data.class.replace('_', '-');
        defectType.innerHTML = `<i class="fas fa-exclamation-triangle ${defectClass}"></i><span class="${defectClass}">${formatDefectName(data.class)}</span>`;
        
        // Update defect description
        defectDescription.textContent = defectDescriptions[data.class] || 'No description available for this defect type.';
        
        // Update confidence
        confidenceValue.textContent = `Confidence: ${data.confidence.toFixed(2)}%`;
        
        // Update probability bars
        probabilityBars.innerHTML = '';
        
        const sortedProbabilities = Object.entries(data.probabilities)
            .sort((a, b) => b[1] - a[1]);
        
        sortedProbabilities.forEach(([defect, probability]) => {
            const defectClass = defect.replace('_', '-');
            const barHTML = `
                <div class="probability-bar">
                    <div class="probability-label">
                        <span>${formatDefectName(defect)}</span>
                        <span>${probability.toFixed(2)}%</span>
                    </div>
                    <div class="probability-progress">
                        <div class="probability-fill" style="width: 0%; background-color: var(--primary-color);"></div>
                    </div>
                </div>
            `;
            
            probabilityBars.insertAdjacentHTML('beforeend', barHTML);
        });
        
        // Animate probability bars
        setTimeout(() => {
            const bars = document.querySelectorAll('.probability-fill');
            sortedProbabilities.forEach((item, index) => {
                const [defect, probability] = item;
                bars[index].style.width = `${probability}%`;
                
                // Set color based on defect type
                const colors = {
                    'crazing': '#3498db',
                    'inclusion': '#e74c3c',
                    'patches': '#f39c12',
                    'pitted_surface': '#9b59b6',
                    'rolled-in_scale': '#1abc9c',
                    'scratches': '#d35400'
                };
                
                bars[index].style.backgroundColor = colors[defect] || 'var(--primary-color)';
            });
        }, 100);
    }
    
    function resetUI() {
        fileInput.value = '';
        imagePreview.src = '#';
        previewContainer.style.display = 'none';
        dropArea.style.display = 'block';
        resultsContainer.style.display = 'none';
    }
    
    function formatDefectName(name) {
        // Convert snake_case or kebab-case to Title Case
        return name
            .replace(/[-_]/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
});
