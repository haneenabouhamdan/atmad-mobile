import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, fonts, radius, spacing } from "../theme/tokens";

type ToastTone = "success" | "error" | "info";

interface ShowOptions {
  message: string;
  tone?: ToastTone;
  durationMs?: number;
}

interface ToastContextValue {
  show: (opts: ShowOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ id: number } & ShowOptions | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const counter = useRef(0);
  const timer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((opts: ShowOptions) => {
    counter.current += 1;
    const id = counter.current;
    setState({ id, ...opts });
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
        setState((prev) => (prev?.id === id ? null : prev));
      });
    }, opts.durationMs ?? 1800);
  }, [opacity]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const value = useMemo<ToastContextValue>(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {state ? (
        <Animated.View pointerEvents="none" style={[styles.wrap, { opacity }]}>
          <View style={[styles.toast, toneStyles[state.tone ?? "success"]]}>
            <Feather
              name={state.tone === "error" ? "alert-triangle" : state.tone === "info" ? "info" : "check"}
              size={14}
              color={colors.inverse}
            />
            <Text style={styles.text}>{state.message}</Text>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 64,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 9999,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.foreground,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  text: {
    color: colors.inverse,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    letterSpacing: 0.4,
  },
});

const toneStyles: Record<ToastTone, { backgroundColor: string }> = {
  success: { backgroundColor: colors.foreground },
  error:   { backgroundColor: colors.destructive },
  info:    { backgroundColor: colors.surface },
};
