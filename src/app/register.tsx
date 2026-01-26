import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import { Link } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../styles/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

type Step = "nome" | "email" | "password" | "idade" | "peso" | "altura" | "objetivo" | "pesoAlvo";
type WeightUnit = "kg" | "lbs";
type HeightUnit = "cm" | "in";

const objectives = [
  { id: "musculo", label: "Ganhar Músculo", icon: "barbell", color: "#687C88" },
  { id: "forca", label: "Ganhar Força", icon: "flash", color: "#10b981" },
  { id: "peso", label: "Perder Peso", icon: "flame", color: "#f59e0b" },
  { id: "atividade", label: "Manter Atividade", icon: "heart", color: "#d946ef" },
];

const ITEM_HEIGHT = 56;
const VISIBLE_ITEMS = 5;

interface PickerWheelProps {
  value: number;
  minValue: number;
  maxValue: number;
  step: number;
  onChange: (value: number) => void;
  unit: string;
  theme: any;
}

function PickerWheel({ value, minValue, maxValue, step, onChange, unit, theme }: PickerWheelProps) {
  const scrollRef = useRef<FlatList>(null);
  const items = Array.from({ length: Math.ceil((maxValue - minValue) / step) + 1 }, (_, i) => minValue + i * step);

  const handleScroll = (event: any) => {
    const contentOffsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(contentOffsetY / ITEM_HEIGHT);
    if (index >= 0 && index < items.length) {
      onChange(items[index]);
    }
  };

  const getItemStyle = (item: number) => {
    const currentIndex = items.indexOf(value);
    const itemIndex = items.indexOf(item);
    const diff = Math.abs(itemIndex - currentIndex);
    
    let opacity = 1;
    let scale = 1;
    
    if (diff === 0) {
      opacity = 1;
      scale = 1;
    } else if (diff === 1) {
      opacity = 0.4;
      scale = 0.85;
    } else if (diff === 2) {
      opacity = 0.2;
      scale = 0.75;
    } else {
      opacity = 0.1;
      scale = 0.7;
    }
    
    return { opacity, scale };
  };

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <View style={{ 
        height: ITEM_HEIGHT * VISIBLE_ITEMS, 
        overflow: "hidden", 
        width: 180,
        position: "relative",
      }}>
        {/* Fade superior */}
        <LinearGradient
          colors={[theme.background, 'transparent']}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: ITEM_HEIGHT * 2,
            zIndex: 10,
            pointerEvents: "none",
          }}
        />
        
        {/* Fade inferior */}
        <LinearGradient
          colors={['transparent', theme.background]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: ITEM_HEIGHT * 2,
            zIndex: 10,
            pointerEvents: "none",
          }}
        />

        {/* Linhas de seleção */}
        <View style={{
          position: "absolute",
          top: ITEM_HEIGHT * 2,
          left: 10,
          right: 10,
          height: ITEM_HEIGHT,
          borderTopColor: theme.border,
          borderBottomColor: theme.border,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          zIndex: 5,
          pointerEvents: "none",
        }} />

        <FlatList
          ref={scrollRef}
          data={items}
          keyExtractor={(item, index) => `${item}-${index}`}
          renderItem={({ item }) => {
            const { opacity, scale } = getItemStyle(item);
            return (
              <View style={{ 
                height: ITEM_HEIGHT, 
                justifyContent: "center", 
                alignItems: "center",
                opacity,
                transform: [{ scale }],
              }}>
                <Text style={{
                  fontSize: 38,
                  fontWeight: "600",
                  color: theme.text,
                }}>
                  {item}
                </Text>
              </View>
            );
          }}
          scrollEventThrottle={16}
          onScroll={handleScroll}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
          scrollEnabled={true}
          nestedScrollEnabled={true}
          getItemLayout={(_, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
        />
      </View>
      
      {/* Unidade abaixo do picker */}
      <Text style={{ 
        fontSize: 16, 
        fontWeight: "600", 
        color: theme.textSecondary, 
        marginTop: 20,
        textTransform: "uppercase",
        letterSpacing: 2,
      }}>
        {unit}
      </Text>
    </View>
  );
}

export default function Register() {
  const { register } = useAuth();
  const theme = useTheme();
  const [step, setStep] = useState<Step>("nome");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [idade, setIdade] = useState(25);
  const [peso, setPeso] = useState(70);
  const [altura, setAltura] = useState(175);
  const [objetivo, setObjetivo] = useState<string>("");
  const [pesoAlvo, setPesoAlvo] = useState(70);

  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [heightUnit, setHeightUnit] = useState<HeightUnit>("cm");

  // Inicializar peso alvo quando vai para o step pesoAlvo
  useEffect(() => {
    if (step === "pesoAlvo" && pesoAlvo === 70 && peso !== 70) {
      setPesoAlvo(peso);
    }
  }, [step]);

  // Steps dinâmicos baseados no objetivo
  const needsTargetWeight = objetivo === "musculo" || objetivo === "peso";
  const baseSteps: Step[] = ["nome", "email", "password", "idade", "peso", "altura", "objetivo"];
  const steps: Step[] = needsTargetWeight ? [...baseSteps, "pesoAlvo"] : baseSteps;
  const stepIndex = steps.indexOf(step);
  const progressPercent = ((stepIndex + 1) / steps.length) * 100;

  const stepTitles: Record<Step, string> = {
    nome: "Como te chamas?",
    email: "Qual é o teu email?",
    password: "Cria uma password",
    idade: "Qual é a tua idade?",
    peso: "Qual é o teu peso?",
    altura: "Qual é a tua altura?",
    objetivo: "Qual é o teu objetivo?",
    pesoAlvo: objetivo === "musculo" ? "Qual peso queres atingir?" : "Qual é o teu peso alvo?",
  };

  function handleNextStep() {
    if (step === "nome" && !nome.trim()) {
      Alert.alert("Erro", "Insere o teu nome");
      return;
    }
    if (step === "email" && (!email.trim() || !email.includes("@"))) {
      Alert.alert("Erro", "Insere um email válido");
      return;
    }
    if (step === "password" && password.length < 6) {
      Alert.alert("Erro", "A password deve ter pelo menos 6 caracteres");
      return;
    }
    if (step === "objetivo" && !objetivo) {
      Alert.alert("Erro", "Escolhe um objetivo");
      return;
    }
    
    // Se estamos no objetivo e precisa de peso alvo, vai para pesoAlvo
    if (step === "objetivo" && (objetivo === "musculo" || objetivo === "peso")) {
      setStep("pesoAlvo");
      return;
    }
    
    const nextStepIndex = stepIndex + 1;
    if (nextStepIndex < steps.length) {
      setStep(steps[nextStepIndex]);
    }
  }

  async function handleRegister() {
    setLoading(true);
    try {
      // Converter para unidades padrão (kg e cm)
      const pesoKg = weightUnit === "lbs" ? peso * 0.453592 : peso;
      const alturaCm = heightUnit === "in" ? altura * 2.54 : altura;

      await register({
        nome,
        email,
        password,
        idade,
        peso: pesoKg,
        altura: alturaCm,
        objetivo,
        pesoAlvo: needsTargetWeight ? (weightUnit === "lbs" ? pesoAlvo * 0.453592 : pesoAlvo) : undefined,
      });
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  }

  function handlePrevStep() {
    const prevStepIndex = stepIndex - 1;
    if (prevStepIndex >= 0) {
      setStep(steps[prevStepIndex]);
    }
  }

  const renderContent = () => {
    switch (step) {
      case "nome":
        return (
          <View style={{ flex: 1, justifyContent: "center" }}>
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: theme.backgroundSecondary,
              borderRadius: 16,
              borderColor: theme.border,
              borderWidth: 1,
              paddingHorizontal: 18,
            }}>
              <Ionicons name="person-outline" size={24} color={theme.textSecondary} />
              <TextInput
                style={{ flex: 1, color: theme.text, paddingVertical: 20, paddingHorizontal: 14, fontSize: 18 }}
                placeholder="O teu nome"
                placeholderTextColor={theme.textSecondary}
                value={nome}
                onChangeText={setNome}
                autoFocus
              />
            </View>
          </View>
        );

      case "email":
        return (
          <View style={{ flex: 1, justifyContent: "center" }}>
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: theme.backgroundSecondary,
              borderRadius: 16,
              borderColor: theme.border,
              borderWidth: 1,
              paddingHorizontal: 18,
            }}>
              <Ionicons name="mail-outline" size={24} color={theme.textSecondary} />
              <TextInput
                style={{ flex: 1, color: theme.text, paddingVertical: 20, paddingHorizontal: 14, fontSize: 18 }}
                placeholder="exemplo@email.com"
                placeholderTextColor={theme.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoFocus
              />
            </View>
          </View>
        );

      case "password":
        return (
          <View style={{ flex: 1, justifyContent: "center" }}>
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: theme.backgroundSecondary,
              borderRadius: 16,
              borderColor: theme.border,
              borderWidth: 1,
              paddingHorizontal: 18,
            }}>
              <Ionicons name="lock-closed-outline" size={24} color={theme.textSecondary} />
              <TextInput
                style={{ flex: 1, color: theme.text, paddingVertical: 20, paddingHorizontal: 14, fontSize: 18 }}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={theme.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoFocus
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={24}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>
        );

      case "idade":
        return (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <PickerWheel
              value={idade}
              minValue={15}
              maxValue={100}
              step={1}
              onChange={setIdade}
              unit="Anos"
              theme={theme}
            />
          </View>
        );

      case "peso":
        return (
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 32, gap: 12 }}>
              <TouchableOpacity
                onPress={() => setWeightUnit("kg")}
                style={{
                  paddingHorizontal: 28,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: weightUnit === "kg" ? theme.text : theme.backgroundSecondary,
                  borderColor: theme.border,
                  borderWidth: 1,
                }}
              >
                <Text style={{ color: weightUnit === "kg" ? theme.background : theme.text, fontWeight: "700", fontSize: 16 }}>
                  KG
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setWeightUnit("lbs")}
                style={{
                  paddingHorizontal: 28,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: weightUnit === "lbs" ? theme.text : theme.backgroundSecondary,
                  borderColor: theme.border,
                  borderWidth: 1,
                }}
              >
                <Text style={{ color: weightUnit === "lbs" ? theme.background : theme.text, fontWeight: "700", fontSize: 16 }}>
                  LBS
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <PickerWheel
                value={peso}
                minValue={weightUnit === "kg" ? 40 : 88}
                maxValue={weightUnit === "kg" ? 200 : 440}
                step={1}
                onChange={setPeso}
                unit={weightUnit === "kg" ? "Quilogramas" : "Libras"}
                theme={theme}
              />
            </View>
          </View>
        );

      case "altura":
        return (
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 32, gap: 12 }}>
              <TouchableOpacity
                onPress={() => setHeightUnit("cm")}
                style={{
                  paddingHorizontal: 28,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: heightUnit === "cm" ? theme.text : theme.backgroundSecondary,
                  borderColor: theme.border,
                  borderWidth: 1,
                }}
              >
                <Text style={{ color: heightUnit === "cm" ? theme.background : theme.text, fontWeight: "700", fontSize: 16 }}>
                  CM
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setHeightUnit("in")}
                style={{
                  paddingHorizontal: 28,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: heightUnit === "in" ? theme.text : theme.backgroundSecondary,
                  borderColor: theme.border,
                  borderWidth: 1,
                }}
              >
                <Text style={{ color: heightUnit === "in" ? theme.background : theme.text, fontWeight: "700", fontSize: 16 }}>
                  IN
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <PickerWheel
                value={altura}
                minValue={heightUnit === "cm" ? 140 : 55}
                maxValue={heightUnit === "cm" ? 230 : 90}
                step={1}
                onChange={setAltura}
                unit={heightUnit === "cm" ? "Centímetros" : "Polegadas"}
                theme={theme}
              />
            </View>
          </View>
        );

      case "objetivo":
        return (
          <View style={{ flex: 1, justifyContent: "center", gap: 14 }}>
            {objectives.map((obj) => (
              <TouchableOpacity
                key={obj.id}
                onPress={() => setObjetivo(obj.id)}
                style={{
                  backgroundColor: objetivo === obj.id ? theme.text : theme.backgroundSecondary,
                  borderColor: objetivo === obj.id ? theme.text : theme.border,
                  borderWidth: 1.5,
                  borderRadius: 16,
                  padding: 18,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  backgroundColor: objetivo === obj.id ? theme.background : theme.background,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}>
                  <Ionicons
                    name={obj.icon as any}
                    size={26}
                    color={objetivo === obj.id ? obj.color : theme.text}
                  />
                </View>
                <Text style={{
                  color: objetivo === obj.id ? theme.background : theme.text,
                  fontSize: 17,
                  fontWeight: "600",
                  flex: 1,
                }}>
                  {obj.label}
                </Text>
                {objetivo === obj.id && (
                  <Ionicons name="checkmark-circle" size={24} color={theme.background} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        );

      case "pesoAlvo":
        return (
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 32, gap: 12 }}>
              <TouchableOpacity
                onPress={() => setWeightUnit("kg")}
                style={{
                  paddingHorizontal: 28,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: weightUnit === "kg" ? theme.text : theme.backgroundSecondary,
                  borderColor: theme.border,
                  borderWidth: 1,
                }}
              >
                <Text style={{ color: weightUnit === "kg" ? theme.background : theme.text, fontWeight: "700", fontSize: 16 }}>
                  KG
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setWeightUnit("lbs")}
                style={{
                  paddingHorizontal: 28,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: weightUnit === "lbs" ? theme.text : theme.backgroundSecondary,
                  borderColor: theme.border,
                  borderWidth: 1,
                }}
              >
                <Text style={{ color: weightUnit === "lbs" ? theme.background : theme.text, fontWeight: "700", fontSize: 16 }}>
                  LBS
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <PickerWheel
                value={pesoAlvo}
                minValue={weightUnit === "kg" ? 40 : 88}
                maxValue={weightUnit === "kg" ? 200 : 440}
                step={1}
                onChange={setPesoAlvo}
                unit={weightUnit === "kg" ? "Quilogramas" : "Libras"}
                theme={theme}
              />
            </View>
            <Text style={{ textAlign: "center", color: theme.textSecondary, fontSize: 14, marginTop: 16 }}>
              {objetivo === "musculo" ? "Peso que pretendes ganhar" : "Peso que pretendes atingir"}
            </Text>
          </View>
        );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <View style={{ flex: 1 }}>
        {/* Conteúdo Principal */}
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 60 }}>
          {/* Header */}
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <View style={{
              width: 72,
              height: 72,
              backgroundColor: theme.backgroundSecondary,
              borderRadius: 18,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
              borderColor: theme.border,
              borderWidth: 1,
            }}>
              <Ionicons name="barbell" size={38} color={theme.text} />
            </View>
            <Text style={{ fontSize: 26, fontWeight: "bold", color: theme.text, textAlign: "center" }}>
              {stepTitles[step]}
            </Text>
            <Text style={{ color: theme.textSecondary, marginTop: 8, fontSize: 14 }}>
              Passo {stepIndex + 1} de {steps.length}
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={{
            height: 3,
            backgroundColor: theme.backgroundSecondary,
            borderRadius: 2,
            marginBottom: 32,
            overflow: "hidden",
          }}>
            <View
              style={{
                height: "100%",
                backgroundColor: theme.text,
                width: `${progressPercent}%`,
                borderRadius: 2,
              }}
            />
          </View>

          {/* Conteúdo do Step */}
          {renderContent()}
        </View>

        {/* Botões Fixos na Base */}
        <View style={{ paddingHorizontal: 24, paddingVertical: 20, backgroundColor: theme.background }}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            {stepIndex > 0 && (
              <TouchableOpacity
                onPress={handlePrevStep}
                style={{
                  flex: 1,
                  backgroundColor: theme.backgroundSecondary,
                  paddingVertical: 18,
                  borderRadius: 14,
                  alignItems: "center",
                  borderColor: theme.border,
                  borderWidth: 1,
                }}
              >
                <Text style={{ color: theme.text, fontWeight: "700", fontSize: 17 }}>Voltar</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={(step === "objetivo" && !needsTargetWeight) || step === "pesoAlvo" ? handleRegister : handleNextStep}
              disabled={loading}
              style={{
                flex: stepIndex > 0 ? 1 : undefined,
                width: stepIndex === 0 ? "100%" : undefined,
                backgroundColor: theme.text,
                paddingVertical: 18,
                borderRadius: 14,
                alignItems: "center",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <ActivityIndicator color={theme.background} />
              ) : (
                <Text style={{ color: theme.background, fontWeight: "700", fontSize: 17 }}>
                  {(step === "objetivo" && !needsTargetWeight) || step === "pesoAlvo" ? "Criar Conta" : "Continuar"}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Link Login */}
          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 20 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 14 }}>
              Já tens conta?{" "}
            </Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text style={{ color: theme.text, fontWeight: "600", fontSize: 14 }}>
                  Fazer Login
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
