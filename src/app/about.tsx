import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

export default function AboutScreen() {
  return (
    <Box className="flex-1 items-center justify-center bg-background-0 p-6">
      <Heading size="lg" className="mb-2">
        About Us
      </Heading>
      <Text>This is a placeholder About Us page.</Text>
    </Box>
  );
}
