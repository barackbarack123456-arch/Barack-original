import { getUniqueKeyForCollection, createHelpTooltip, COLLECTIONS } from '../../public/utils.js';

describe('getUniqueKeyForCollection', () => {
  test('should return "codigo_pieza" for PRODUCTOS', () => {
    expect(getUniqueKeyForCollection(COLLECTIONS.PRODUCTOS)).toBe('codigo_pieza');
  });

  test('should return "codigo_pieza" for SEMITERMINADOS', () => {
    expect(getUniqueKeyForCollection(COLLECTIONS.SEMITERMINADOS)).toBe('codigo_pieza');
  });

  test('should return "codigo_pieza" for INSUMOS', () => {
    expect(getUniqueKeyForCollection(COLLECTIONS.INSUMOS)).toBe('codigo_pieza');
  });

  test('should return "codigo" for PROYECTOS', () => {
    expect(getUniqueKeyForCollection(COLLECTIONS.PROYECTOS)).toBe('codigo');
  });

  test('should return "id" for CLIENTES', () => {
    expect(getUniqueKeyForCollection(COLLECTIONS.CLIENTES)).toBe('id');
  });

  test('should return "id" for USUARIOS', () => {
    expect(getUniqueKeyForCollection(COLLECTIONS.USUARIOS)).toBe('id');
  });

  test('should return "id" for an unknown collection', () => {
    expect(getUniqueKeyForCollection('UNA_COLECCION_INEXISTENTE')).toBe('id');
  });

  test('should return "id" for a null or undefined collection name', () => {
    expect(getUniqueKeyForCollection(null)).toBe('id');
    expect(getUniqueKeyForCollection(undefined)).toBe('id');
  });
});

describe('createHelpTooltip', () => {
  test('should return a string', () => {
    const message = 'This is a help message.';
    const tooltip = createHelpTooltip(message);
    expect(typeof tooltip).toBe('string');
  });

  test('should contain the help message', () => {
    const message = 'This is a test message.';
    const tooltip = createHelpTooltip(message);
    expect(tooltip).toContain(message);
  });

  test('should contain the correct HTML structure', () => {
    const message = 'Another message.';
    const tooltip = createHelpTooltip(message);
    expect(tooltip).toContain('<div class="help-tooltip-container"');
    expect(tooltip).toContain('<i data-lucide="help-circle" class="help-icon"></i>');
    expect(tooltip).toContain('<div class="help-tooltip-content"');
  });

  test('should generate a unique tooltip ID', () => {
    const message = 'Test';
    const tooltip1 = createHelpTooltip(message);
    const tooltip2 = createHelpTooltip(message);

    const id1_match = tooltip1.match(/id="([^"]+)"/);
    const id2_match = tooltip2.match(/id="([^"]+)"/);

    const id1 = id1_match ? id1_match[1] : null;
    const id2 = id2_match ? id2_match[1] : null;

    expect(id1).not.toBeNull();
    expect(id2).not.toBeNull();
    expect(id1).not.toEqual(id2);
  });
});
