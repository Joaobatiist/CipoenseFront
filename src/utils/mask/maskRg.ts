export function rgMask(value: string): string {
  // 1. Remove todos os caracteres não numéricos.
  let cleanValue = value.replace(/\D/g, '');

  // 2. Limita o valor a no máximo 10 dígitos.
  cleanValue = cleanValue.substring(0, 10);

  // 3. Aplica a formatação com base no comprimento do valor.

  // 10 dígitos (Formato final): xx.xxx.xxx-xx
  if (cleanValue.length === 10) {
    return cleanValue.replace(/^(\d{2})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }

  // 9 dígitos: xx.xxx.xxx-x
  if (cleanValue.length === 9) {
    return cleanValue.replace(/^(\d{2})(\d{3})(\d{3})(\d{1})$/, '$1.$2.$3-$4');
  }

  // 8 dígitos: xx.xxx.xxx
  if (cleanValue.length === 8) {
    return cleanValue.replace(/^(\d{2})(\d{3})(\d{3})$/, '$1.$2.$3');
  }

  // 5, 6 ou 7 dígitos: xx.xxx.xxx (Ex: 12.345.67)
  if (cleanValue.length >= 5) {
    return cleanValue.replace(/^(\d{2})(\d{3})(\d{1,3})$/, '$1.$2.$3');
  }

  // 3 ou 4 dígitos: xx.xx
  if (cleanValue.length >= 3) {
    return cleanValue.replace(/^(\d{2})(\d{1,3})$/, '$1.$2');
  }

  // Menos de 3 dígitos, retorna o valor limpo (ex: 1 ou 12)
  return cleanValue;
}