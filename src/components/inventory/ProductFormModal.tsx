import { useState } from "react";
import { Modal, TextInput, ScrollView } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Image } from "@/components/ui/image";
import { Button, ButtonText } from "@/components/ui/button";
import { useInventoryStore } from "@/store/inventoryStore";

type VariantDraft = {
  size: string;
  color: string;
  quantity: string;
};

const INPUT_CLASS =
  "mb-2 rounded-lg border border-outline-300 bg-background-50 px-3 py-2 text-typography-900";
const PLACEHOLDER_COLOR = "#9CA3AF";

export function ProductFormModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const addProduct = useInventoryStore((s) => s.addProduct);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [variants, setVariants] = useState<VariantDraft[]>([
    { size: "", color: "", quantity: "" },
  ]);

  const updateVariant = (
    index: number,
    field: keyof VariantDraft,
    value: string,
  ) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    );
  };

  const addVariantRow = () =>
    setVariants((prev) => [...prev, { size: "", color: "", quantity: "" }]);

  const removeVariantRow = (index: number) =>
    setVariants((prev) => prev.filter((_, i) => i !== index));

  const reset = () => {
    setName("");
    setBrand("");
    setSellingPrice("");
    setCostPrice("");
    setImage(null);
    setVariants([{ size: "", color: "", quantity: "" }]);
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert("Permission to access photos is required to add a product image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    if (!name.trim() || !sellingPrice.trim()) return;

    const validVariants = variants
      .filter((v) => v.size.trim() || v.color.trim())
      .map((v) => ({
        size: v.size.trim() || "One Size",
        color: v.color.trim() || "Default",
        quantity: Number(v.quantity) || 0,
      }));

    addProduct({
      name: name.trim(),
      brand: brand.trim() || undefined,
      sellingPrice: Number(sellingPrice) || 0,
      costPrice: costPrice ? Number(costPrice) : undefined,
      image: image || undefined,
      variants: validVariants,
    });

    reset();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Box className="flex-1 justify-end bg-black/40">
        <Box className="max-h-[85%] rounded-t-2xl bg-background-0 p-5">
          <Heading size="md" className="mb-4">
            Add Product
          </Heading>

          <ScrollView showsVerticalScrollIndicator={false}>
            <VStack space="sm" className="mb-4">
              <Text size="sm" bold>
                Product image
              </Text>

              {image ? (
                <VStack space="sm" className="mb-2 items-start">
                  <Image
                    source={{ uri: image }}
                    alt="Product image preview"
                    className="h-32 w-32 rounded-md"
                    resizeMode="cover"
                  />
                  <HStack space="sm">
                    <Button size="sm" variant="outline" onPress={pickImage}>
                      <ButtonText size="sm">Change</ButtonText>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onPress={() => setImage(null)}
                    >
                      <ButtonText size="sm" className="text-error-600">
                        Remove
                      </ButtonText>
                    </Button>
                  </HStack>
                </VStack>
              ) : (
                <Button
                  variant="outline"
                  className="mb-2 self-start"
                  onPress={pickImage}
                >
                  <ButtonText size="sm">+ Upload image</ButtonText>
                </Button>
              )}

              <Text size="sm" bold>
                Product name
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Gucci Ace Sneaker"
                placeholderTextColor={PLACEHOLDER_COLOR}
                className={INPUT_CLASS}
              />

              <Text size="sm" bold>
                Brand (optional)
              </Text>
              <TextInput
                value={brand}
                onChangeText={setBrand}
                placeholder="e.g. Gucci"
                placeholderTextColor={PLACEHOLDER_COLOR}
                className={INPUT_CLASS}
              />

              <HStack space="md">
                <VStack className="flex-1">
                  <Text size="sm" bold>
                    Selling price
                  </Text>
                  <TextInput
                    value={sellingPrice}
                    onChangeText={setSellingPrice}
                    placeholder="0.00"
                    placeholderTextColor={PLACEHOLDER_COLOR}
                    keyboardType="numeric"
                    className={INPUT_CLASS}
                  />
                </VStack>
                <VStack className="flex-1">
                  <Text size="sm" bold>
                    Cost price (optional)
                  </Text>
                  <TextInput
                    value={costPrice}
                    onChangeText={setCostPrice}
                    placeholder="0.00"
                    placeholderTextColor={PLACEHOLDER_COLOR}
                    keyboardType="numeric"
                    className={INPUT_CLASS}
                  />
                </VStack>
              </HStack>
            </VStack>

            <Text size="sm" bold className="mb-2">
              Variants (size / color / quantity)
            </Text>

            {variants.map((variant, index) => (
              <HStack key={index} space="sm" className="mb-2 items-center">
                <TextInput
                  value={variant.size}
                  onChangeText={(v) => updateVariant(index, "size", v)}
                  placeholder="Size (e.g. 39)"
                  placeholderTextColor={PLACEHOLDER_COLOR}
                  className={`flex-1 ${INPUT_CLASS}`}
                />
                <TextInput
                  value={variant.color}
                  onChangeText={(v) => updateVariant(index, "color", v)}
                  placeholder="Color"
                  placeholderTextColor={PLACEHOLDER_COLOR}
                  className={`flex-1 ${INPUT_CLASS}`}
                />
                <TextInput
                  value={variant.quantity}
                  onChangeText={(v) => updateVariant(index, "quantity", v)}
                  placeholder="Qty"
                  placeholderTextColor={PLACEHOLDER_COLOR}
                  keyboardType="numeric"
                  className={`w-16 ${INPUT_CLASS}`}
                />
                {variants.length > 1 && (
                  <Button
                    variant="link"
                    onPress={() => removeVariantRow(index)}
                  >
                    <ButtonText size="sm">✕</ButtonText>
                  </Button>
                )}
              </HStack>
            ))}

            <Button
              variant="outline"
              className="mb-4 mt-1"
              onPress={addVariantRow}
            >
              <ButtonText size="sm">+ Add another variant</ButtonText>
            </Button>
          </ScrollView>

          <HStack space="md" className="mt-2">
            <Button
              variant="outline"
              className="flex-1"
              onPress={() => {
                reset();
                onClose();
              }}
            >
              <ButtonText size="sm">Cancel</ButtonText>
            </Button>
            <Button className="flex-1" onPress={handleSave}>
              <ButtonText size="sm">Save Product</ButtonText>
            </Button>
          </HStack>
        </Box>
      </Box>
    </Modal>
  );
}
