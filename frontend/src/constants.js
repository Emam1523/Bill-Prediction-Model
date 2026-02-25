export const FEATURE_NAMES = [
  'TYPEHUQ','HDD30YR','CDD30YR','BEDROOMS','NCOMBATH','TOTROOMS',
  'CELLAR','GARGHEAT','HEATROOM','ACROOMS','USECENAC','TEMPNITEAC',
  'TOTSQFT','TOTHSQFT','TOTCSQFT','KWH','KWHCOL','KWHRFG','KWHOTH',
  'DOLELCOL','DOLELWTH','DOLELRFG','DOLELOTH','DOLLAREL',
];

export const FEATURE_DESC = {
  TYPEHUQ:     'Type of Housing Unit',
  HDD30YR:     'Heating Degree Days (30-yr avg)',
  CDD30YR:     'Cooling Degree Days (30-yr avg)',
  BEDROOMS:    'Number of Bedrooms',
  NCOMBATH:    'Number of Full Bathrooms',
  TOTROOMS:    'Total Rooms',
  CELLAR:      'Has Basement / Cellar (0/1)',
  GARGHEAT:    'Heated Attached Garage (0/1)',
  HEATROOM:    'Rooms Heated',
  ACROOMS:     'Rooms Cooled',
  USECENAC:    'Central A/C Usage Frequency (1-5)',
  TEMPNITEAC:  'Night Temperature with A/C (\u00b0F)',
  TOTSQFT:     'Total Square Footage',
  TOTHSQFT:    'Total Heated Sq Ft',
  TOTCSQFT:    'Total Cooled Sq Ft',
  KWH:         'Total Electricity Usage (kWh)',
  KWHCOL:      'A/C Electricity Usage (kWh)',
  KWHRFG:      'Refrigerator Usage (kWh)',
  KWHOTH:      'Other Electricity Usage (kWh)',
  DOLELCOL:    'A/C Electricity Cost ($)',
  DOLELWTH:    'Water Heating Cost ($)',
  DOLELRFG:    'Refrigerator Cost ($)',
  DOLELOTH:    'Other Electricity Cost ($)',
  DOLLAREL:    'Total Electricity Bill ($) \u2014 TARGET',
};

export const HOUSING_TYPES = {
  1: 'Mobile Home',
  2: 'Single-Family Detached',
  3: 'Single-Family Attached',
  4: 'Apartment (2-4 units)',
  5: 'Apartment (5+ units)',
};
