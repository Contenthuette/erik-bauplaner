import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import { Authenticated, Unauthenticated, AuthLoading, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { colors } from "../lib/theme";

function Splash() {
    return (
        <View style={styles.center}>
            <ActivityIndicator color={colors.textPrimary} />
        </View>
    );
}

function RoleRouter() {
    const me = useQuery(api.users.getCurrentUser);
    if (me === undefined) return <Splash />;
    if (me === null) return <Redirect href="/(auth)/login" />;

    if (me.rolle === "kunde") {
        return <Redirect href="/(customer)/bauvorhaben" />;
    }
    // owner / mitarbeiter -> Admin-Oberfläche
    return <Redirect href="/(admin)/dashboard" />;
}

export default function Index() {
    return (
        <>
            <AuthLoading>
                <Splash />
            </AuthLoading>
            <Unauthenticated>
                <Redirect href="/(auth)/login" />
            </Unauthenticated>
            <Authenticated>
                <RoleRouter />
            </Authenticated>
        </>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.background,
    },
});
