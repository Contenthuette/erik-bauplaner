import { Stack } from "expo-router";
import { colors } from "../../../lib/theme";

export default function ProjektLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
            }}
        >
            <Stack.Screen name="[id]" />
            <Stack.Screen
                name="bearbeiten"
                options={{ presentation: "modal" }}
            />
        </Stack>
    );
}
