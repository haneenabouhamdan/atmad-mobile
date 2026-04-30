import { View } from "react-native";
import { useRegionalPreferences } from "../regional/RegionalPreferencesContext";
import { CountryCodePicker } from "./CountryCodePicker";
import type { Country } from "../data/countries";
import { spacing } from "../theme/tokens";

/**
 * Home feed header: deals region picker aligned top-right.
 */
export function GlobalRegionBar() {
  const rp = useRegionalPreferences();

  return (
    <View style={{
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xs,
      paddingBottom: spacing.sm,
      minHeight: 44,
    }}>
      <CountryCodePicker
        selected={rp.country}
        summary="market"
        placement="headerRight"
        onSelect={(c: Country) => {
          void rp.setCountryIso(c.code);
        }}
      />
    </View>
  );
}
