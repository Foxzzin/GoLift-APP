import { Tabs } from "expo-router";
import { View, TouchableOpacity, StyleSheet, Pressable, Animated } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRef } from "react";
import { useTheme } from "../../styles/theme";

function CustomTabBar({ state, descriptors, navigation }: any) {
  const theme = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        useNativeDriver: false,
      }),
      Animated.spring(translateYAnim, {
        toValue: -8,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: false,
      }),
      Animated.spring(translateYAnim, {
        toValue: 0,
        useNativeDriver: false,
      }),
    ]).start();
  };

  return (
    <View style={[styles.tabBarContainer]}>
      <BlurView intensity={35} style={[styles.blurContainer, { borderColor: theme.border }]}>
        <View style={[styles.tabBar, { backgroundColor: 'rgba(0,0,0,0.1)' }]}>
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            const iconNameMap = {
              index: "home" as const,
              workouts: "barbell" as const,
              metrics: "stats-chart" as const,
              profile: "person" as const,
            };

            const iconName = (iconNameMap[route.name as keyof typeof iconNameMap] || "home") as keyof typeof Ionicons.glyphMap;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            // Botão central de começar treino (após os 2 primeiros itens)
            if (index === 2) {
              return (
                <View key="center-button" style={styles.centerButtonWrapper}>
                  {/* Botão Começar Treino */}
                  <Pressable
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    onPress={() => router.push("/(tabs)/workouts")}
                  >
                    <Animated.View
                      style={[
                        styles.centerButton,
                        { backgroundColor: theme.accent },
                        {
                          transform: [
                            { scale: scaleAnim },
                            { translateY: translateYAnim },
                          ],
                        },
                      ]}
                    >
                      <Ionicons name="play" size={24} color="white" />
                    </Animated.View>
                  </Pressable>

                  {/* Tab atual (metrics) */}
                  <TouchableOpacity
                    key={route.key}
                    onPress={onPress}
                    style={styles.tab}
                  >
                    <Ionicons
                      name={iconName as any}
                      size={24}
                      color={isFocused ? theme.text : theme.textTertiary}
                    />
                  </TouchableOpacity>
                </View>
              );
            }

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={styles.tab}
              >
                <Ionicons
                  name={iconName as any}
                  size={24}
                  color={isFocused ? theme.text : theme.textTertiary}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props: any) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="workouts" />
      <Tabs.Screen name="metrics" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
  },
  blurContainer: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
  },
  tabBar: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "space-around",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  centerButtonWrapper: {
    flexDirection: "row",
    alignItems: "center",
    flex: 2,
    justifyContent: "space-around",
  },
  centerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },  
});

