
import { GoogleGenAI } from "@google/genai";
import { CartItem } from "../types";

const apiKey = process.env.API_KEY || "";

const ai = new GoogleGenAI({ apiKey });

export const generateChefNote = async (items: CartItem[]): Promise<string> => {
  if (!apiKey) {
    return "Terima kasih telah makan di Deb's Kitchen! (AI Key missing)";
  }

  try {
    const itemList = items.map(i => `${i.quantity}x ${i.name}`).join(", ");
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Anda adalah kepala koki yang ramah dan lucu di "Deb's Kitchen".
      Seorang pelanggan baru saja memesan: ${itemList}.
      
      Tuliskan "Catatan Koki" (Chef's Note) yang singkat, hangat, dan sedikit lucu dalam BAHASA INDONESIA untuk dicetak di struk mereka.
      Mungkin komentari selera bagus mereka atau berikan fakta seru tentang salah satu bahannya.
      Buat di bawah 30 kata. Tanpa hashtag.`,
    });

    return response.text || "Selamat menikmati hidangan lezat dari Deb's Kitchen!";
  } catch (error) {
    console.error("Error generating chef note:", error);
    return "Selamat Makan! Kami berharap dapat melihat Anda lagi segera.";
  }
};

export const generateSalesInsight = async (totalSales: number, topItem: string): Promise<string> => {
    if (!apiKey) return "AI Insights tidak tersedia.";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analisis snapshot penjualan harian ini untuk sebuah kafe kecil.
            Total Pendapatan: Rp ${totalSales}.
            Item Terlaris: ${topItem}.
            
            Berikan ringkasan eksekutif 2 kalimat untuk pemilik dalam BAHASA INDONESIA, yang menyemangati tetapi tetap profesional.`,
        });
        return response.text || "Penjualan terlihat bagus hari ini.";
    } catch (error) {
        return "Tidak dapat menghasilkan wawasan saat ini.";
    }
}