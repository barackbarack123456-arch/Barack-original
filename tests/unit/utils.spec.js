import { getUniqueKeyForCollection, COLLECTIONS } from '../../public/utils.js';

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
