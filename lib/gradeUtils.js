export const normalizeGradeName = (value = '') => String(value || '').trim();

export const normalizeGradeList = (grades = []) => {
  const seen = new Set();

  return (Array.isArray(grades) ? grades : [])
    .map(normalizeGradeName)
    .filter((grade) => {
      if (!grade) return false;
      const key = grade.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

export const getPackageGradeName = (pkg = null) => normalizeGradeName(pkg?.gradeName);

export const packageMatchesGrade = (pkg = null, selectedGrade = '') => {
  const normalizedSelectedGrade = normalizeGradeName(selectedGrade);
  const packageGrade = getPackageGradeName(pkg);

  if (!normalizedSelectedGrade) return true;
  if (!packageGrade) return true;

  return packageGrade.toLowerCase() === normalizedSelectedGrade.toLowerCase();
};

export const mergeGradeOptions = (...gradeSets) => {
  const flattened = gradeSets.flatMap((grades) => {
    if (!Array.isArray(grades)) return [];
    return grades;
  });

  return normalizeGradeList(flattened);
};
