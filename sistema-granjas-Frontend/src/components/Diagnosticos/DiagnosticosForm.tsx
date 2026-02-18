// ... dentro del return, en paso === 2 ...

{/* Secciones específicas según el tipo de diagnóstico seleccionado */}
{formData.tipo && (
  <div className="mt-4">
    {formData.tipo === 'censo' && (
      <CensoSection
        plantas={plantasSeleccionadas}
        caracterizacion={caracterizacion}
        onCampoChange={handleCaracterizacionChange}
      />
    )}
    {formData.tipo === 'fenologico' && (
      <FenologicoSection
        plantas={plantasSeleccionadas.map(p => ({ ...p, fase: '' }))}
        caracterizacion={caracterizacion}
        onCampoChange={handleCaracterizacionChange}
        onFaseChange={(idx, fase) => {
          // Si necesitas manejar cambios de fase, puedes implementarlo aquí
          // Por ahora, podrías actualizar la caracterización o dejarlo vacío
        }}
      />
    )}
    {formData.tipo === 'artropodos' && (
      <ArthropodSection
        plantas={plantasSeleccionadas}
        caracterizacion={caracterizacion}
        onCampoChange={handleCaracterizacionChange}
        // Si ArthropodSection requiere props adicionales, agrégalos aquí
      />
    )}
  </div>
)}

{/* Si no hay tipo seleccionado, puedes mostrar un mensaje opcional */}
{!formData.tipo && (
  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
    <p className="text-sm text-yellow-700">
      Selecciona un tipo de diagnóstico (Censo, Fenológico o Artrópodos) para completar la caracterización.
    </p>
  </div>
)}