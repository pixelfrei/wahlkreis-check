const BASE_URL =
  "https://open-data.dortmund.de/api/explore/v2.1/catalog/datasets/";
const PAGE_SIZE = 100;

export async function fetchAllRecords<T>(datasetId: string): Promise<T[]> {
  const records: T[] = [];
  let offset = 0;
  let totalCount = Infinity;

  while (offset < totalCount) {
    const url = `${BASE_URL}${datasetId}/records?limit=${PAGE_SIZE}&offset=${offset}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Opendatasoft-Request fehlgeschlagen (${response.status}): ${url}`,
      );
    }
    const body = (await response.json()) as {
      total_count: number;
      results: T[];
    };
    totalCount = body.total_count;
    records.push(...body.results);
    offset += PAGE_SIZE;
  }

  return records;
}
