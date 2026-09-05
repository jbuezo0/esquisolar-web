document.addEventListener('DOMContentLoaded', () => {
  const systemSelect = document.querySelector('#tipo-sistema');
  const hybridSections = document.querySelectorAll('[data-hybrid-only]');
  const departmentSelect = document.querySelector('#departamento');
  const municipalitySelect = document.querySelector('#municipio');

  function updateHybridFields() {
    const show = systemSelect.value === 'Híbrido con baterías';
    hybridSections.forEach(section => {
      section.hidden = !show;
      section.style.display = show ? '' : 'none';
      section.querySelectorAll('input, select, textarea').forEach(control => {
        control.disabled = !show;
        if (!show && control.type === 'checkbox') control.checked = false;
      });
    });
  }

  systemSelect.addEventListener('change', updateHybridFields);
  updateHybridFields();

  try {
    const locations = window.GT_LOCATIONS;
    if (!Array.isArray(locations) || !locations.length) throw new Error('No se pudo cargar la lista de ubicaciones');

    locations.forEach(item => {
      departmentSelect.add(new Option(item.departamento, item.departamento));
    });

    departmentSelect.addEventListener('change', () => {
      const selected = locations.find(item => item.departamento === departmentSelect.value);
      municipalitySelect.innerHTML = '<option value="">Seleccione un municipio</option>';
      municipalitySelect.disabled = !selected;
      if (selected) selected.municipios.forEach(name => municipalitySelect.add(new Option(name, name)));
    });
  } catch (error) {
    departmentSelect.innerHTML = '<option value="">No se pudo cargar la lista</option>';
    departmentSelect.disabled = true;
    municipalitySelect.disabled = true;
    console.error(error);
  }
});
