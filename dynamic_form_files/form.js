function updateGpuAvailabilityWarning() {
    var gpuTypeSelect = document.getElementById('batch_connect_session_context_gpu_type');
    if (!gpuTypeSelect) {
      return;
    }
  
    var selectedGpuType = gpuTypeSelect.value;
    
    // Read unavailable_gpus data from the select's dataset or attribute
    var datasetValue = (gpuTypeSelect.dataset && gpuTypeSelect.dataset.unavailableGpus) ? gpuTypeSelect.dataset.unavailableGpus : null;
    var attrValue = datasetValue ? null : gpuTypeSelect.getAttribute('data-unavailable-gpus');
    var unavailableJson = datasetValue || attrValue;
    
    if (!unavailableJson) {
      console.warn('[gpu-warning] update: no data-unavailable-gpus found');
      return;
    }
  
    var unavailableMap;
    try {
      unavailableMap = JSON.parse(unavailableJson);
    } catch (e) {
      console.error('[gpu-warning] update: failed to parse data-unavailable-gpus JSON', e);
      return;
    }
  
    // Find or create the warning container
    var warningId = 'gpu-unavailable-warning';
    var existingWarning = document.getElementById(warningId);
    
    // Check if the selected GPU type is unavailable
    var isUnavailable = unavailableMap.hasOwnProperty(selectedGpuType) && selectedGpuType !== 'any' && selectedGpuType !== '';
    
    try {
      console.log('[gpu-warning] update:', {
        selectedGpuType: selectedGpuType,
        isUnavailable: isUnavailable,
        unavailableMap: unavailableMap
      });
    } catch (_) {}
    
    if (isUnavailable) {
      var gpuLabel = unavailableMap[selectedGpuType];
      var warningMessage = 'All nodes with ' + gpuLabel + ' GPUs are currently DOWN or DRAINED. Your job will remain queued until nodes become available.';
      
      if (existingWarning) {
        // Update existing warning message
        var messageSpan = existingWarning.querySelector('.gpu-warning-message');
        if (messageSpan) {
          // Clear and rebuild the content to preserve the "Warning: " prefix
          messageSpan.innerHTML = '';
          var strong = document.createElement('strong');
          strong.textContent = 'Warning: ';
          messageSpan.appendChild(strong);
          messageSpan.appendChild(document.createTextNode(warningMessage));
        }
        existingWarning.style.display = 'block';
      } else {
        // Create new warning
        var warning = document.createElement('div');
        warning.id = warningId;
        warning.className = 'alert alert-danger alert-dismissible fade show';
        warning.setAttribute('role', 'alert');
        warning.style.marginTop = '10px';
        
        var content = document.createElement('span');
        content.className = 'gpu-warning-message';
        var strong = document.createElement('strong');
        strong.textContent = 'Warning: ';
        content.appendChild(strong);
        content.appendChild(document.createTextNode(warningMessage));
        
        var closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'btn-close';
        closeButton.setAttribute('data-bs-dismiss', 'alert');
        closeButton.setAttribute('aria-label', 'Close');
        
        // Add manual click handler as fallback
        closeButton.addEventListener('click', function() {
          warning.style.display = 'none';
        });
        
        warning.appendChild(content);
        warning.appendChild(closeButton);
        
        // Insert warning after the GPU type select's form group (Bootstrap 5 uses .mb-3)
        var formGroup = gpuTypeSelect.closest('.mb-3') || gpuTypeSelect.closest('.form-group');
        if (formGroup && formGroup.parentNode) {
          formGroup.parentNode.insertBefore(warning, formGroup.nextSibling);
        }
      }
    } else {
      // Hide warning if GPU is available or no GPU is selected.
      if (existingWarning) {
        existingWarning.style.display = 'none';
      }
    }
  }
  
  function repopulateGpuTypesForPartition() {
    var partitionSelect = document.getElementById('batch_connect_session_context_partition');
    var gpuTypeSelect = document.getElementById('batch_connect_session_context_gpu_type');
    if (!partitionSelect) {
      console.warn('[gpu] repopulate: missing partition select element');
      return;
    }
    if (!gpuTypeSelect) {
      return;
    }
  
    var selected = partitionSelect.value;
    // Read from select's dataset (preferred) or attribute (fallback)
    var datasetValue = (gpuTypeSelect.dataset && gpuTypeSelect.dataset.partitionOptions) ? gpuTypeSelect.dataset.partitionOptions : null;
    var attrValue = datasetValue ? null : gpuTypeSelect.getAttribute('data-partition-options');
    var optionsSource = datasetValue ? 'select-dataset' : (attrValue ? 'select-attribute' : null);
    var optionsJson = datasetValue || attrValue;
    if (!optionsJson) {
      console.warn('[gpu] repopulate: no data-partition-options found (attr or dataset)');
      return; }
  
    var map;
    try {
      map = JSON.parse(optionsJson);
    } catch (e) {
      console.error('[gpu] repopulate: failed to parse data-partition-options JSON', e);
      return;
    }
    // Check whether the selected partition has at least one concrete GPU option.
    var partitionOptions = (map && Object.prototype.hasOwnProperty.call(map, selected)) ? map[selected] : [];
    var partitionHasGpus = partitionOptions.some(function (opt) {
      var value = Array.isArray(opt) ? opt[1] : opt;
      return value && value !== 'none' && value !== 'any';
    });
    var gpuFormGroup = gpuTypeSelect.closest('.mb-3') || gpuTypeSelect.closest('.form-group');
  
    var numGpusInput = document.getElementById('batch_connect_session_context_num_gpus');
    var numGpusFormGroup = numGpusInput ? (numGpusInput.closest('.mb-3') || numGpusInput.closest('.form-group')) : null;
  
    if (!partitionHasGpus) {
      // Partition has no GPUs: hide GPU fields and clear the submitted GPU value.
      try {
        console.log('[gpu] repopulate: partition "' + selected + '" has no GPUs, hiding gpu_type field');
      } catch (_) {}
  
      if (gpuFormGroup) {
        gpuFormGroup.style.display = 'none';
      }
      if (numGpusFormGroup) {
        numGpusFormGroup.style.display = 'none';
      }
      if (numGpusInput) {
        numGpusInput.value = '';
      }
  
      // Clear options and submit a blank GPU value for CPU-only jobs.
      while (gpuTypeSelect.firstChild) {
        gpuTypeSelect.removeChild(gpuTypeSelect.firstChild);
      }
      var blankOpt = document.createElement('option');
      blankOpt.textContent = '';
      blankOpt.value = '';
      gpuTypeSelect.appendChild(blankOpt);
      gpuTypeSelect.value = '';
      return;
    }
  
    // Partition has GPUs — show the fields
    if (gpuFormGroup) {
      gpuFormGroup.style.display = '';
    }
    if (numGpusFormGroup) {
      numGpusFormGroup.style.display = '';
    }
    if (numGpusInput && !numGpusInput.value) {
      numGpusInput.value = '1';
    }
  
    var usedKey = selected;
    var opts = partitionOptions;
    try {
      console.log('[gpu] repopulate: start', {
        selectedPartition: selected,
        source: optionsSource,
        usedKey: usedKey,
        mapKeys: map ? Object.keys(map) : [],
        rawLength: opts.length
      });
    } catch (_) {}
  
    // Preserve current value if possible
    var previousValue = gpuTypeSelect.value;
    try { console.log('[gpu] repopulate: previousValue', previousValue); } catch (_) {}
  
    // Remove existing options
    while (gpuTypeSelect.firstChild) {
      gpuTypeSelect.removeChild(gpuTypeSelect.firstChild);
    }
  
    // Rebuild options: each entry is [label, value]
    opts.forEach(function (pair) {
      var label = pair[0];
      var value = pair[1];
      var opt = document.createElement('option');
      opt.textContent = label;
      opt.value = value;
      gpuTypeSelect.appendChild(opt);
    });
  
    try {
      console.log('[gpu] repopulate: rebuilt options', Array.from(gpuTypeSelect.options).map(function (o) { return [o.text, o.value]; }));
    } catch (_) {}
  
    // Try to restore previous selection or default to first option
    if (previousValue) {
      gpuTypeSelect.value = previousValue;
    }
    if (!gpuTypeSelect.value && gpuTypeSelect.options.length > 0) {
      gpuTypeSelect.selectedIndex = 0;
    }
    try { console.log('[gpu] repopulate: final selection', gpuTypeSelect.value || '(blank)'); } catch (_) {}
  }
  
  function updateNumGpusForPartition() {
    var partitionSelect = document.getElementById('batch_connect_session_context_partition');
    var gpuTypeSelect = document.getElementById('batch_connect_session_context_gpu_type');
    var numGpusInput = document.getElementById('batch_connect_session_context_num_gpus');
  
    if (!partitionSelect || !numGpusInput) {
      console.warn('[num_gpus] update: missing partition or num_gpus input element');
      return;
    }
  
    var selectedPartition = partitionSelect.value;
    var selectedGpuType = gpuTypeSelect ? gpuTypeSelect.value : 'none';
  
    if (!selectedGpuType || selectedGpuType === 'none') {
      numGpusInput.value = '';
      return;
    }
  
    var datasetValue = (numGpusInput.dataset && numGpusInput.dataset.partitionGpuMaxGpus) ? numGpusInput.dataset.partitionGpuMaxGpus : null;
    var attrValue = datasetValue ? null : numGpusInput.getAttribute('data-partition-gpu-max-gpus');
    var optionsSource = datasetValue ? 'input-dataset' : (attrValue ? 'input-attribute' : null);
    var optionsJson = datasetValue || attrValue;
  
    if (!optionsJson) {
      console.warn('[num_gpus] update: no data-partition-gpu-max-gpus found');
      return;
    }
  
    var map;
    try {
      map = JSON.parse(optionsJson);
    } catch (e) {
      console.error('[num_gpus] update: failed to parse data-partition-gpu-max-gpus JSON', e);
      return;
    }
  
    var maxGpus = null;
    if (map[selectedPartition] && map[selectedPartition][selectedGpuType]) {
      maxGpus = map[selectedPartition][selectedGpuType];
    } else if (map[selectedPartition] && map[selectedPartition]['any']) {
      maxGpus = map[selectedPartition]['any'];
    } else if (map['all'] && map['all'][selectedGpuType]) {
      maxGpus = map['all'][selectedGpuType];
    } else if (map['all'] && map['all']['any']) {
      maxGpus = map['all']['any'];
    }
  
    try {
      console.log('[num_gpus] update: start', {
        selectedPartition: selectedPartition,
        selectedGpuType: selectedGpuType,
        source: optionsSource,
        maxGpus: maxGpus
      });
    } catch (_) {}
  
    if (!maxGpus || maxGpus <= 0) {
      numGpusInput.value = '';
      console.warn('[num_gpus] update: invalid max GPUs for partition+GPU', selectedPartition, selectedGpuType);
      return;
    }
  
    var currentValue = parseInt(numGpusInput.value, 10) || 1;
    numGpusInput.setAttribute('max', maxGpus);
  
    if (currentValue > maxGpus) {
      numGpusInput.value = maxGpus;
      try { console.log('[num_gpus] update: adjusted value from', currentValue, 'to', maxGpus); } catch (_) {}
    } else if (!numGpusInput.value) {
      numGpusInput.value = '1';
    }
  
    var helpText = numGpusInput.parentElement.querySelector('.form-text, .help-block');
    if (helpText) {
      helpText.textContent = 'Number of GPUs to allocate on one node. Max varies by partition and GPU type (Maximum: ' + maxGpus + ' GPUs).';
      try { console.log('[num_gpus] update: updated help text to show', maxGpus, 'GPUs'); } catch (_) {}
    }
  
    try { console.log('[num_gpus] update: final max =', maxGpus, ', value =', numGpusInput.value); } catch (_) {}
  }
  
  function updateCoresForPartition() {
    var partitionSelect = document.getElementById('batch_connect_session_context_partition');
    var gpuTypeSelect = document.getElementById('batch_connect_session_context_gpu_type');
    var coresInput = document.getElementById('batch_connect_session_context_num_cores');
    
    if (!partitionSelect || !coresInput) {
      console.warn('[cores] update: missing partition or cores input element');
      return;
    }
  
    var selectedPartition = partitionSelect.value;
    var selectedGpuType = gpuTypeSelect ? gpuTypeSelect.value : 'none';
    
    // Read partition_gpu_max_cores data from the cores input's dataset or attribute
    var datasetValue = (coresInput.dataset && coresInput.dataset.partitionGpuMaxCores) ? coresInput.dataset.partitionGpuMaxCores : null;
    var attrValue = datasetValue ? null : coresInput.getAttribute('data-partition-gpu-max-cores');
    var optionsSource = datasetValue ? 'input-dataset' : (attrValue ? 'input-attribute' : null);
    var optionsJson = datasetValue || attrValue;
    
    if (!optionsJson) {
      console.warn('[cores] update: no data-partition-gpu-max-cores found');
      return;
    }
  
    var map;
    try {
      map = JSON.parse(optionsJson);
    } catch (e) {
      console.error('[cores] update: failed to parse data-partition-gpu-max-cores JSON', e);
      return;
    }
  
    // Lookup with fallbacks: partition->gpu_type, then 'all'->gpu_type, then 'all'->'any'
    var maxCores = null;
    if (map[selectedPartition] && map[selectedPartition][selectedGpuType]) {
      maxCores = map[selectedPartition][selectedGpuType];
    } else if (map[selectedPartition] && map[selectedPartition]['any']) {
      maxCores = map[selectedPartition]['any'];
    } else if (map['all'] && map['all'][selectedGpuType]) {
      maxCores = map['all'][selectedGpuType];
    } else if (map['all'] && map['all']['any']) {
      maxCores = map['all']['any'];
    }
    
    try {
      console.log('[cores] update: start', {
        selectedPartition: selectedPartition,
        selectedGpuType: selectedGpuType,
        source: optionsSource,
        maxCores: maxCores
      });
    } catch (_) {}
  
    if (!maxCores || maxCores <= 0) {
      console.warn('[cores] update: invalid max cores for partition+GPU', selectedPartition, selectedGpuType);
      return;
    }
  
    var currentValue = parseInt(coresInput.value) || 1;
  
    // Update max attribute
    coresInput.setAttribute('max', maxCores);
    
    // If current value exceeds new max, adjust it
    if (currentValue > maxCores) {
      coresInput.value = maxCores;
      try { console.log('[cores] update: adjusted value from', currentValue, 'to', maxCores); } catch (_) {}
    }
  
    // Update help text to show partition+GPU specific max
    var helpText = coresInput.parentElement.querySelector('.form-text, .help-block');
    if (helpText) {
      helpText.textContent = 'Number of CPU cores/threads to allocate. Max varies by partition and GPU type (Maximum: ' + maxCores + ' cores).';
      try { console.log('[cores] update: updated help text to show', maxCores, 'cores'); } catch (_) {}
    }
    
    try { console.log('[cores] update: final max =', maxCores, ', value =', coresInput.value); } catch (_) {}
  }
  
  function updateMemoryForPartition() {
    var partitionSelect = document.getElementById('batch_connect_session_context_partition');
    var gpuTypeSelect = document.getElementById('batch_connect_session_context_gpu_type');
    var memoryInput = document.getElementById('batch_connect_session_context_num_memory');
    
    if (!partitionSelect || !memoryInput) {
      console.warn('[memory] update: missing partition or memory input element');
      return;
    }
  
    var selectedPartition = partitionSelect.value;
    var selectedGpuType = gpuTypeSelect ? gpuTypeSelect.value : 'none';
    
    // Read partition_gpu_max_memory data from the memory input's dataset or attribute
    var datasetValue = (memoryInput.dataset && memoryInput.dataset.partitionGpuMaxMemory) ? memoryInput.dataset.partitionGpuMaxMemory : null;
    var attrValue = datasetValue ? null : memoryInput.getAttribute('data-partition-gpu-max-memory');
    var optionsSource = datasetValue ? 'input-dataset' : (attrValue ? 'input-attribute' : null);
    var optionsJson = datasetValue || attrValue;
    
    if (!optionsJson) {
      console.warn('[memory] update: no data-partition-gpu-max-memory found');
      return;
    }
  
    var map;
    try {
      map = JSON.parse(optionsJson);
    } catch (e) {
      console.error('[memory] update: failed to parse data-partition-gpu-max-memory JSON', e);
      return;
    }
  
    // Lookup with fallbacks: partition->gpu_type, then 'all'->gpu_type, then 'all'->'any'
    var maxMemoryMB = null;
    if (map[selectedPartition] && map[selectedPartition][selectedGpuType]) {
      maxMemoryMB = map[selectedPartition][selectedGpuType];
    } else if (map[selectedPartition] && map[selectedPartition]['any']) {
      maxMemoryMB = map[selectedPartition]['any'];
    } else if (map['all'] && map['all'][selectedGpuType]) {
      maxMemoryMB = map['all'][selectedGpuType];
    } else if (map['all'] && map['all']['any']) {
      maxMemoryMB = map['all']['any'];
    }
    
    if (!maxMemoryMB || maxMemoryMB <= 0) {
      console.warn('[memory] update: invalid max memory for partition+GPU', selectedPartition, selectedGpuType);
      return;
    }
  
    // Convert MB to GB and round to nearest whole number (no decimals)
    var maxMemoryGB = Math.round(maxMemoryMB / 1024.0);
    
    try {
      console.log('[memory] update: start', {
        selectedPartition: selectedPartition,
        selectedGpuType: selectedGpuType,
        source: optionsSource,
        maxMemoryMB: maxMemoryMB,
        maxMemoryGB: maxMemoryGB
      });
    } catch (_) {}
  
    var currentValue = parseFloat(memoryInput.value) || 4;
  
    // Update max attribute
    memoryInput.setAttribute('max', maxMemoryGB);
    
    // If current value exceeds new max, adjust it
    if (currentValue > maxMemoryGB) {
      memoryInput.value = maxMemoryGB;
      try { console.log('[memory] update: adjusted value from', currentValue, 'to', maxMemoryGB); } catch (_) {}
    }
  
    // Update help text to show partition+GPU specific max
    var helpText = memoryInput.parentElement.querySelector('.form-text, .help-block');
    if (helpText) {
      helpText.textContent = 'Amount of memory to allocate per node in GB. Max varies by partition and GPU type (Maximum: ' + maxMemoryGB + ' GB).';
      try { console.log('[memory] update: updated help text to show', maxMemoryGB, 'GB'); } catch (_) {}
    }
    
    try { console.log('[memory] update: final max =', maxMemoryGB, 'GB, value =', memoryInput.value); } catch (_) {}
  }
  
  function updateHoursForPartition() {
    var partitionSelect = document.getElementById('batch_connect_session_context_partition');
    var hoursInput = document.getElementById('batch_connect_session_context_bc_num_hours');
    
    if (!partitionSelect || !hoursInput) {
      console.warn('[hours] update: missing partition or hours input element');
      return;
    }
  
    var selectedPartition = partitionSelect.value;
    
    // Read partition_max_hours data from the hours input's dataset or attribute
    var datasetValue = (hoursInput.dataset && hoursInput.dataset.partitionMaxHours) ? hoursInput.dataset.partitionMaxHours : null;
    var attrValue = datasetValue ? null : hoursInput.getAttribute('data-partition-max-hours');
    var optionsSource = datasetValue ? 'input-dataset' : (attrValue ? 'input-attribute' : null);
    var optionsJson = datasetValue || attrValue;
    
    if (!optionsJson) {
      console.warn('[hours] update: no data-partition-max-hours found');
      return;
    }
  
    var map;
    try {
      map = JSON.parse(optionsJson);
    } catch (e) {
      console.error('[hours] update: failed to parse data-partition-max-hours JSON', e);
      return;
    }
  
    // Lookup with fallback to 'all'
    var maxHours = null;
    if (map[selectedPartition]) {
      maxHours = map[selectedPartition];
    } else if (map['all']) {
      maxHours = map['all'];
    }
    
    try {
      console.log('[hours] update: start', {
        selectedPartition: selectedPartition,
        source: optionsSource,
        maxHours: maxHours
      });
    } catch (_) {}
  
    if (!maxHours || maxHours <= 0) {
      console.warn('[hours] update: invalid max hours for partition', selectedPartition);
      return;
    }
  
    var currentValue = parseInt(hoursInput.value) || 1;
  
    // Update max attribute
    hoursInput.setAttribute('max', maxHours);
    
    // If current value exceeds new max, adjust it
    if (currentValue > maxHours) {
      hoursInput.value = maxHours;
      try { console.log('[hours] update: adjusted value from', currentValue, 'to', maxHours); } catch (_) {}
    }
  
    // Update help text to show partition-specific max
    var helpText = hoursInput.parentElement.querySelector('.form-text, .help-block');
    if (helpText) {
      helpText.textContent = 'Number of hours to run the job. Max varies by partition (Maximum: ' + maxHours + ' hours).';
      try { console.log('[hours] update: updated help text to show', maxHours, 'hours'); } catch (_) {}
    }
    
    try { console.log('[hours] update: final max =', maxHours, ', value =', hoursInput.value); } catch (_) {}
  }
  
  function initializeResourceDiscoveryForm() {
    if (window.oodResourceDiscoveryInitialized) {
      return true;
    }
  
    try { console.log('[gpu] initializing GPU options, cores, memory, hours, and availability warnings'); } catch (_) {}
    var partitionSelect = document.getElementById('batch_connect_session_context_partition');
    if (!partitionSelect) {
      try { console.warn('[gpu] initialize: partition select not found yet, will retry'); } catch (_) {}
      return false;
    }
  
    window.oodResourceDiscoveryInitialized = true;
  
    repopulateGpuTypesForPartition();
    updateNumGpusForPartition();
    updateCoresForPartition();
    updateMemoryForPartition();
    updateHoursForPartition();
    updateGpuAvailabilityWarning();
    
    var gpuTypeSelect = document.getElementById('batch_connect_session_context_gpu_type');
    
    partitionSelect.addEventListener('change', function () {
      try { console.log('[partition] change ->', partitionSelect.value); } catch (_) {}
      repopulateGpuTypesForPartition();
      updateNumGpusForPartition();
      updateCoresForPartition();
      updateMemoryForPartition();
      updateHoursForPartition();
      updateGpuAvailabilityWarning();
    });
    
    if (gpuTypeSelect) {
      gpuTypeSelect.addEventListener('change', function () {
        try { console.log('[gpu_type] change ->', gpuTypeSelect.value); } catch (_) {}
        updateNumGpusForPartition();
        updateCoresForPartition();
        updateMemoryForPartition();
        updateGpuAvailabilityWarning();
      });
    }
  
    return true;
  }
  
  function initializeResourceDiscoveryFormWhenReady() {
    if (initializeResourceDiscoveryForm()) {
      return;
    }
  
    setTimeout(initializeResourceDiscoveryForm, 250);
    setTimeout(initializeResourceDiscoveryForm, 1000);
  
    if (window.MutationObserver) {
      var observer = new MutationObserver(function () {
        if (initializeResourceDiscoveryForm()) {
          observer.disconnect();
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeResourceDiscoveryFormWhenReady);
  } else {
    initializeResourceDiscoveryFormWhenReady();
  }