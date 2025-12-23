import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Disease {
    name: string;
    scientificName: string;
    description: string;
    symptoms: string[];
    causes: string[];
    treatment: string[];
    prevention: string[];
    wikiUrl: string;
    searchKeywords: string[];
}

interface DiseaseDatabase {
    diseases: { [key: string]: Disease };
}

let diseaseDb: DiseaseDatabase | null = null;

/**
 * Load disease database from JSON file
 */
function loadDiseaseDatabase(): DiseaseDatabase {
    if (diseaseDb) {
        return diseaseDb;
    }

    try {
        const dbPath = path.resolve(__dirname, '../../../models/disease_database.json');
        const dbContent = fs.readFileSync(dbPath, 'utf-8');
        diseaseDb = JSON.parse(dbContent);
        return diseaseDb!;
    } catch (error) {
        console.error('❌ Lỗi khi tải database bệnh:', error);
        // Return empty database if file not found
        return { diseases: {} };
    }
}

/**
 * Tìm kiếm thông tin bệnh theo tên
 */
export function searchDiseaseByName(diseaseName: string): Disease | null {
    const db = loadDiseaseDatabase();

    // Tìm kiếm chính xác
    const exactMatch = Object.values(db.diseases).find(disease =>
        disease.name.toLowerCase() === diseaseName.toLowerCase() ||
        disease.scientificName.toLowerCase() === diseaseName.toLowerCase()
    );

    if (exactMatch) return exactMatch;

    // Tìm kiếm gần đúng
    const partialMatch = Object.values(db.diseases).find(disease =>
        disease.name.toLowerCase().includes(diseaseName.toLowerCase()) ||
        disease.searchKeywords.some(keyword =>
            keyword.toLowerCase().includes(diseaseName.toLowerCase())
        )
    );

    return partialMatch || null;
}

/**
 * Lấy tất cả thông tin bệnh
 */
export function getAllDiseases(): Disease[] {
    const db = loadDiseaseDatabase();
    return Object.values(db.diseases);
}

/**
 * Tìm kiếm bệnh theo từ khóa
 */
export function searchDiseases(keyword: string): Disease[] {
    const db = loadDiseaseDatabase();
    const searchTerm = keyword.toLowerCase().trim();

    if (!searchTerm) return getAllDiseases();

    return Object.values(db.diseases).filter(disease =>
        disease.name.toLowerCase().includes(searchTerm) ||
        disease.scientificName.toLowerCase().includes(searchTerm) ||
        disease.description.toLowerCase().includes(searchTerm) ||
        disease.symptoms.some(symptom => symptom.toLowerCase().includes(searchTerm)) ||
        disease.searchKeywords.some(kw => kw.toLowerCase().includes(searchTerm))
    );
}

/**
 * Tạo URL Google Search cho bệnh
 */
export function getGoogleSearchUrl(diseaseName: string): string {
    const searchQuery = encodeURIComponent(`${diseaseName} bệnh cây trồng điều trị phòng chống`);
    return `https://www.google.com/search?q=${searchQuery}`;
}

/**
 * Tạo URL Wikipedia Search cho bệnh  
 */
export function getWikipediaSearchUrl(diseaseName: string): string {
    const searchQuery = encodeURIComponent(diseaseName);
    return `https://vi.wikipedia.org/wiki/Special:Search?search=${searchQuery}`;
}

/**
 * Lấy thông tin chi tiết bệnh để hiển thị
 */
export function getDiseaseInfo(diseaseId: string): Disease | null {
    const db = loadDiseaseDatabase();
    return db.diseases[diseaseId] || null;
}

export default {
    searchDiseaseByName,
    getAllDiseases,
    searchDiseases,
    getGoogleSearchUrl,
    getWikipediaSearchUrl,
    getDiseaseInfo
};