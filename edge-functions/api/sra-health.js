export async function onRequest({ SRA_KV }) {
  try {
    await SRA_KV.put("sra_test", "KV connection successful");

    const value = await SRA_KV.get("sra_test");

    return Response.json({
      ok: true,
      kv: true,
      value
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        kv: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}