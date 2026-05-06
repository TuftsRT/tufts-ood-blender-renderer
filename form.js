function parseJsonData(el, datasetKey, attrName) {
  if (!el) return null;
  var raw = (el.dataset && el.dataset[datasetKey]) ? el.dataset[datasetKey] : el.getAttribute(attrName);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

function getElements() {
  return {
    partition: document.getElementById('batch_connect_session_context_partition'),
    gpuType: document.getElementById('batch_connect_session_context_gpu_type'),
    numGpus: document.getElementById('batch_connect_session_context_num_gpus'),
    numCores: document.getElementById('batch_connect_session_context_num_cores'),
    numMemory: document.getElementById('batch_connect_session_context_num_memory'),
    numHours: document.getElementById('batch_connect_session_context_bc_num_hours')
  };
}

function maxForPartitionAndGpu(map, partition, gpuType) {
  if (!map) return null;
  if (map[partition] && map[partition][gpuType]) return map[partition][gpuType];
  if (map[partition] && map[partition].any) return map[partition].any;
  if (map.all && map.all[gpuType]) return map.all[gpuType];
  if (map.all && map.all.any) return map.all.any;
  return null;
}

function updateGpuTypeOptions(elements) {
  var partition = elements.partition;
  var gpuType = elements.gpuType;
  if (!partition || !gpuType) return;

  var optionsMap = parseJsonData(gpuType, 'partitionOptions', 'data-partition-options');
  if (!optionsMap) return;

  var selectedPartition = partition.value;
  var options = optionsMap[selectedPartition] || optionsMap.all || [];
  var previousValue = gpuType.value;

  while (gpuType.firstChild) gpuType.removeChild(gpuType.firstChild);

  options.forEach(function (pair) {
    var opt = document.createElement('option');
    opt.textContent = pair[0];
    opt.value = pair[1];
    gpuType.appendChild(opt);
  });

  if (previousValue) gpuType.value = previousValue;
  if (!gpuType.value && gpuType.options.length > 0) gpuType.selectedIndex = 0;
}

function updateNumberField(input, maxValue, fallbackValue, helpText) {
  if (!input || !maxValue || maxValue <= 0) return;

  var current = parseInt(input.value, 10);
  if (!Number.isFinite(current) || current < 1) current = fallbackValue;

  input.setAttribute('max', String(maxValue));
  input.value = String(Math.min(current, maxValue));

  var help = input.parentElement ? input.parentElement.querySelector('.form-text, .help-block') : null;
  if (help && helpText) help.textContent = helpText(maxValue);
}

function updateGpuUnavailableWarning(elements) {
  if (!elements.gpuType) return;

  var unavailable = parseJsonData(elements.gpuType, 'unavailableGpus', 'data-unavailable-gpus') || {};
  var selected = elements.gpuType.value;
  var warningId = 'gpu-unavailable-warning';
  var existing = document.getElementById(warningId);
  var isUnavailable = Object.prototype.hasOwnProperty.call(unavailable, selected) && selected !== 'any' && selected !== '';

  if (!isUnavailable) {
    if (existing) existing.style.display = 'none';
    return;
  }

  var label = unavailable[selected];
  var message = 'All nodes with ' + label + ' GPUs are currently DOWN or DRAINED. Your job will remain queued until nodes become available.';

  if (!existing) {
    existing = document.createElement('div');
    existing.id = warningId;
    existing.className = 'alert alert-danger';
    existing.style.marginTop = '10px';
    var group = elements.gpuType.closest('.mb-3') || elements.gpuType.closest('.form-group');
    if (group && group.parentNode) group.parentNode.insertBefore(existing, group.nextSibling);
  }

  existing.textContent = message;
  existing.style.display = 'block';
}

function applyAllResourceLimits() {
  var elements = getElements();
  if (!elements.partition) return;

  updateGpuTypeOptions(elements);

  var partition = elements.partition.value;
  var gpuType = elements.gpuType ? elements.gpuType.value : 'none';

  var gpusMap = parseJsonData(elements.numGpus, 'partitionGpuMaxGpus', 'data-partition-gpu-max-gpus');
  var coresMap = parseJsonData(elements.numCores, 'partitionGpuMaxCores', 'data-partition-gpu-max-cores');
  var memMap = parseJsonData(elements.numMemory, 'partitionGpuMaxMemory', 'data-partition-gpu-max-memory');
  var hoursMap = parseJsonData(elements.numHours, 'partitionMaxHours', 'data-partition-max-hours');

  var maxGpus = maxForPartitionAndGpu(gpusMap, partition, gpuType);
  var maxCores = maxForPartitionAndGpu(coresMap, partition, gpuType);
  var maxMemMb = maxForPartitionAndGpu(memMap, partition, gpuType);
  var maxHours = hoursMap ? (hoursMap[partition] || hoursMap.all) : null;

  updateNumberField(elements.numGpus, maxGpus, 1, function (max) {
    return 'Number of GPUs to allocate on one node. Max varies by partition and GPU type (Maximum: ' + max + ' GPUs).';
  });

  updateNumberField(elements.numCores, maxCores, 1, function (max) {
    return 'Number of CPU cores/threads to allocate. Max varies by partition and GPU type (Maximum: ' + max + ' cores).';
  });

  var maxMemGb = maxMemMb ? Math.round(maxMemMb / 1024.0) : null;
  updateNumberField(elements.numMemory, maxMemGb, 4, function (max) {
    return 'Amount of memory to allocate per node in GB. Max varies by partition and GPU type (Maximum: ' + max + ' GB).';
  });

  updateNumberField(elements.numHours, maxHours, 1, function (max) {
    return 'Number of hours to run the job. Max varies by partition (Maximum: ' + max + ' hours).';
  });

  updateGpuUnavailableWarning(elements);
}

function initializeResourceDiscovery() {
  if (window.oodResourceDiscoveryInitialized) return;
  var elements = getElements();
  if (!elements.partition) return;

  window.oodResourceDiscoveryInitialized = true;
  applyAllResourceLimits();

  elements.partition.addEventListener('change', applyAllResourceLimits);
  if (elements.gpuType) elements.gpuType.addEventListener('change', applyAllResourceLimits);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeResourceDiscovery);
} else {
  initializeResourceDiscovery();
}
