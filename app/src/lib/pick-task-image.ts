import * as ImagePicker from "expo-image-picker";

import { TASK_MEDIA_RULES } from "@shared/schemas/task-media-schema";

export type ImageSource = "library" | "camera";

export type PickImageResult =
  | { status: "picked"; uri: string; mimeType: string }
  | { status: "canceled" }
  | { status: "error"; message: string };

// Fallback when the picker doesn't report a type; compressed images are JPEG
function mimeTypeFromUri(uri: string) {
  const extension = uri.split(".").pop()?.toLowerCase();
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  return "image/jpeg";
}

// Compressing also makes iOS return JPEG instead of HEIC, which the API rejects
const options: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  quality: 0.7,
  allowsEditing: false,
};

// Opens the photo library or the camera and checks the image against the API's rules
export async function pickTaskImage(
  source: ImageSource,
): Promise<PickImageResult> {
  if (source === "camera") {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      return {
        status: "error",
        message:
          "Ge appen tillgång till kameran i Inställningar för att ta ett foto.",
      };
    }
  }

  let result: ImagePicker.ImagePickerResult;
  try {
    result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
  } catch (error) {
    return {
      status: "error",
      message: `Kunde inte öppna ${source === "camera" ? "kameran" : "bildbiblioteket"}: ${String(error)}`,
    };
  }
  if (result.canceled) return { status: "canceled" };

  const asset = result.assets[0];
  const mimeType = asset.mimeType ?? mimeTypeFromUri(asset.uri);
  const rules = TASK_MEDIA_RULES.image;
  if (!(rules.mimeTypes as readonly string[]).includes(mimeType)) {
    return {
      status: "error",
      message: "Bildformatet stöds inte. Välj en JPEG-, PNG- eller WebP-bild.",
    };
  }
  if (asset.fileSize !== undefined && asset.fileSize > rules.maxBytes) {
    return { status: "error", message: "Bilden är för stor (max 5 MB)." };
  }

  return { status: "picked", uri: asset.uri, mimeType };
}
