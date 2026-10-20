export function experienceLabel(years) {
  if (years == null) return null;
  return years === 0 ? 'Entry level' : `${years}+ yrs`;
}

export function citiesLabel(cities = []) {
  if (cities.length === 0) return null;
  if (cities.length <= 2) return cities.join(', ');
  return `${cities[0]} +${cities.length - 1}`;
}
