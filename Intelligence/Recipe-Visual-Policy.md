# Recipe Visual Policy

Every recipe shown in Brew Helper should carry a saved visual when one is available.

1. Use an exact or strongest filename match from `Visuals/Recipes` first.
2. For Lume recipes without an exact recipe image, use any image whose filename contains `Lume` from `Visuals/Lume`.
3. Otherwise match a coffee, origin, or farm term against `Visuals/Farms` and `Visuals/Lume`; for example, Ethiopia uses an image whose filename contains `Ethiopia`.
4. Use the matching café visual only as the final fallback.
5. Copy the selected file into the deployed site's `assets/recipe-visuals/` directory during the data sync. Never use an unrelated stock image.

The matching is deterministic so the same recipe keeps the same visual until a closer match is added.
