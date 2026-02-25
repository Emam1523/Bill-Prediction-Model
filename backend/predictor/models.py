from django.db import models


class HouseholdRecord(models.Model):
    """One row of the RECS 2009 dataset (24 project columns)."""

    typehuq = models.FloatField(verbose_name="Housing Type")
    hdd30yr = models.FloatField(verbose_name="Heating Degree Days (30yr)")
    cdd30yr = models.FloatField(verbose_name="Cooling Degree Days (30yr)")
    bedrooms = models.FloatField(verbose_name="Bedrooms")
    ncombath = models.FloatField(verbose_name="Full Bathrooms")
    totrooms = models.FloatField(verbose_name="Total Rooms")
    cellar = models.FloatField(verbose_name="Has Cellar (0/1)")
    gargheat = models.FloatField(verbose_name="Heated Garage (0/1)")
    heatroom = models.FloatField(verbose_name="Rooms Heated")
    acrooms = models.FloatField(verbose_name="Rooms Cooled")
    usecenac = models.FloatField(verbose_name="Central AC Usage")
    tempniteac = models.FloatField(verbose_name="Night Temp AC")
    totsqft = models.FloatField(verbose_name="Total Sq Ft")
    tothsqft = models.FloatField(verbose_name="Heated Sq Ft")
    totcsqft = models.FloatField(verbose_name="Cooled Sq Ft")
    kwh = models.FloatField(verbose_name="Total kWh")
    kwhcol = models.FloatField(verbose_name="AC kWh")
    kwhrfg = models.FloatField(verbose_name="Refrigerator kWh")
    kwhoth = models.FloatField(verbose_name="Other kWh")
    dolelcol = models.FloatField(verbose_name="AC Cost $")
    dolelwth = models.FloatField(verbose_name="Water Heat Cost $")
    dolelrfg = models.FloatField(verbose_name="Refrigerator Cost $")
    doleloth = models.FloatField(verbose_name="Other Cost $")
    dollarel = models.FloatField(verbose_name="Annual Bill $ (target)")

    class Meta:
        db_table = "household_records"
        verbose_name = "Household Record"
        verbose_name_plural = "Household Records"

    # Column order must match FEATURE_NAMES in knn_model.py
    FIELD_ORDER = [
        "typehuq", "hdd30yr", "cdd30yr", "bedrooms", "ncombath", "totrooms",
        "cellar", "gargheat", "heatroom", "acrooms", "usecenac", "tempniteac",
        "totsqft", "tothsqft", "totcsqft", "kwh", "kwhcol", "kwhrfg", "kwhoth",
        "dolelcol", "dolelwth", "dolelrfg", "doleloth", "dollarel",
    ]

    def to_row(self):
        """Return a 24-float list matching FEATURE_NAMES order."""
        return [getattr(self, f) for f in self.FIELD_ORDER]

    def __str__(self):
        return f"Household #{self.pk} — ${self.dollarel:.0f}"
