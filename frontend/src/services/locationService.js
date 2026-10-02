export const getNearbyHospitals = async (latitude, longitude) => {
  const radius = 5000; // 5 km

  const query = `
    [out:json];
    (
      node["amenity"="hospital"](around:${radius},${latitude},${longitude});
      way["amenity"="hospital"](around:${radius},${latitude},${longitude});
      relation["amenity"="hospital"](around:${radius},${latitude},${longitude});
    );
    out center;
  `;

  const response = await fetch(
    "https://overpass-api.de/api/interpreter",
    {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      body: query,
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch nearby hospitals");
  }

  const data = await response.json();

  return data.elements.map((hospital) => {
    const lat = hospital.lat ?? hospital.center?.lat;
    const lon = hospital.lon ?? hospital.center?.lon;

    return {
      id: hospital.id,
      name: hospital.tags?.name || "Unnamed Hospital",
      latitude: lat,
      longitude: lon,
      address:
        hospital.tags?.["addr:full"] ||
        hospital.tags?.["addr:street"] ||
        "Address unavailable",
      phone: hospital.tags?.phone || "",
    };
  });
};