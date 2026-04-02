// ... (código anterior sin cambios hasta la definición de CuadranteArthropod)

// ── CuadranteArthropod con validación y limpieza de errores ──────────────────

const CuadranteArthropod: React.FC<{
  plantaIdx: number; cuadrante: number; rama: number; planta: PlantaBase;
  caracterizacion: Record<string, string>;
  onCampoChange: (campo: string, valor: string) => void;
  onOpenImage: (imageName: string) => void;
  errores: Record<string, string>;
  clearErrorsForPrefix: (prefix: string) => void; // nueva prop
}> = ({ plantaIdx, cuadrante, rama, planta, caracterizacion, onCampoChange, onOpenImage, errores, clearErrorsForPrefix }) => {
  const basePrefix = `artropodo_planta_${plantaIdx + 1}`;
  const presenciaKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_presencia`;
  const presencia = caracterizacion[presenciaKey] || "no";

  const claseKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_clase`;
  const claseString = caracterizacion[claseKey] || "";
  const isInsecto = claseString.includes('insecto');
  const isAracnido = claseString.includes('aracnido');

  // Función para limpiar datos y errores de una clase
  const clearClassData = (tipo: 'insecto' | 'aracnido') => {
    const tipoPrefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_${tipo === 'insecto' ? 'insecto' : 'acaro'}`;
    Object.keys(caracterizacion).forEach(k => {
      if (k.startsWith(tipoPrefix)) {
        onCampoChange(k, "");
      }
    });
    const tiposKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_${tipo === 'insecto' ? 'insecto_tipos' : 'acaro_tipos'}`;
    onCampoChange(tiposKey, "");
    // Limpiar errores asociados
    clearErrorsForPrefix(tipoPrefix);
  };

  // Manejo del cambio de presencia
  const handlePresenciaChange = (valor: string) => {
    onCampoChange(presenciaKey, valor);
    if (valor === "no") {
      // Limpiar todas las clases y datos asociados
      onCampoChange(claseKey, "");
      clearClassData('insecto');
      clearClassData('aracnido');
      // Limpiar "otro artrópodo"
      const otroActivoKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_otro_activo`;
      onCampoChange(otroActivoKey, "false");
      const otroPrefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_otro`;
      Object.keys(caracterizacion).forEach(k => {
        if (k.startsWith(otroPrefix)) onCampoChange(k, "");
      });
      // Limpiar errores del cuadrante completo
      clearErrorsForPrefix(`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}`);
    }
  };

  // Manejo de checkboxes de clase
  const handleClassToggle = (clase: 'insecto' | 'aracnido') => {
    let newClases = claseString ? claseString.split(',') : [];
    const index = newClases.indexOf(clase);
    if (index === -1) {
      newClases.push(clase);
    } else {
      newClases.splice(index, 1);
      clearClassData(clase);
    }
    onCampoChange(claseKey, newClases.join(','));
  };

  // Insectos
  const insectoTiposKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_insecto_tipos`;
  const insectoTiposArray = (caracterizacion[insectoTiposKey] || "").split(",").filter(Boolean);

  const handleInsectoTipoChange = (tipo: string, checked: boolean) => {
    let arr = [...insectoTiposArray];
    if (checked) {
      if (!arr.includes(tipo)) arr.push(tipo);
    } else {
      arr = arr.filter(t => t !== tipo);
      const prefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_insecto_${tipo}`;
      // Limpiar datos del tipo
      Object.keys(caracterizacion).forEach(k => {
        if (k.startsWith(prefix)) onCampoChange(k, "");
      });
      // Limpiar errores
      clearErrorsForPrefix(prefix);
    }
    onCampoChange(insectoTiposKey, arr.join(","));
  };

  // Ácaros
  const acaroTiposKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_acaro_tipos`;
  const acaroTiposArray = (caracterizacion[acaroTiposKey] || "").split(",").filter(Boolean);

  const handleAcaroTipoChange = (tipo: string, checked: boolean) => {
    let arr = [...acaroTiposArray];
    if (checked) {
      if (!arr.includes(tipo)) arr.push(tipo);
    } else {
      arr = arr.filter(t => t !== tipo);
      const prefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_acaro_${tipo}`;
      Object.keys(caracterizacion).forEach(k => {
        if (k.startsWith(prefix)) onCampoChange(k, "");
      });
      clearErrorsForPrefix(prefix);
    }
    onCampoChange(acaroTiposKey, arr.join(","));
  };

  const insectoTiposDisponibles = [
    { value: 'compsus',     label: <><em>Compsus sp.</em> – Picudo</>,                  image: 'compsussp.png' },
    { value: 'diaphorina',  label: <><em>Diaphorina citri</em> - Psílido asiático</>,   image: 'diaphorinacitri.png' },
    { value: 'phyllocnistis',label: <><em>Phyllocnistis sp.</em> - Minador de la hoja</>,image: 'phyllocnistissp.png' },
    { value: 'toxoptera',   label: <><em>Toxoptera citricidus</em> - Pulgón negro</>,   image: 'toxopteracitricidus.png' },
  ];

  const acaroTiposDisponibles = [
    { value: 'polyphagotarsonemus', label: <><em>Polyphago- tarsonemus sp.</em> - Ácaro blanco</>,  image: 'polyphagotarsonemussp.png' },
    { value: 'phyllocoptruta',      label: <><em>Phyllocoptruta sp.</em> - Ácaro tostador</>,     image: 'phyllocoptrutasp.png' },
  ];

  // Errores específicos
  const errorPresenciaKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_presencia_error`;
  const errorClaseKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_clase_error`;
  const errorInsectoKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_insecto_error`;
  const errorAcaroKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_acaro_error`;

  return (
    <div className="ml-6 mb-6 p-4 border-l-4 border-blue-200 bg-gray-50 rounded">
      <h5 className="font-medium text-md text-gray-700 mb-3">Rama {rama} - Cuadrante {cuadrante}</h5>

      {/* Presencia de artrópodos */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ¿Hay presencia de artrópodos en la RAMA {rama} del CUADRANTE {cuadrante}? *
        </label>
        <div className="flex gap-6">
          <label className="inline-flex items-center">
            <input type="radio" name={presenciaKey} value="si"
              checked={presencia === "si"}
              onChange={(e) => handlePresenciaChange(e.target.value)}
              className="mr-2" required />
            Sí
          </label>
          <label className="inline-flex items-center">
            <input type="radio" name={presenciaKey} value="no"
              checked={presencia === "no"}
              onChange={(e) => handlePresenciaChange(e.target.value)}
              className="mr-2" required />
            Ninguno
          </label>
        </div>
        {errores[errorPresenciaKey] && (
          <p className="text-red-600 text-xs mt-1">{errores[errorPresenciaKey]}</p>
        )}
      </div>

      {presencia === "si" && (
        <>
          {/* Clases de artrópodo - checkboxes múltiples */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clase(s) de artrópodo observado (puede seleccionar ambos) *
            </label>
            <div className="flex gap-6">
              <label className="inline-flex items-center">
                <input type="checkbox"
                  checked={isInsecto}
                  onChange={() => handleClassToggle('insecto')}
                  className="mr-2" />
                Insecto
              </label>
              <label className="inline-flex items-center">
                <input type="checkbox"
                  checked={isAracnido}
                  onChange={() => handleClassToggle('aracnido')}
                  className="mr-2" />
                Arácnido
              </label>
            </div>
            {errores[errorClaseKey] && (
              <p className="text-red-600 text-xs mt-1">{errores[errorClaseKey]}</p>
            )}
          </div>

          {/* Insectos */}
          {isInsecto && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccione el insecto observado en la RAMA {rama} del CUADRANTE {cuadrante} (Selección múltiple)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                {insectoTiposDisponibles.map(tipo => (
                  <div key={tipo.value} className="flex items-center gap-2">
                    <label className="inline-flex items-center">
                      <input type="checkbox" checked={insectoTiposArray.includes(tipo.value)}
                        onChange={(e) => handleInsectoTipoChange(tipo.value, e.target.checked)} className="mr-2" />
                      {tipo.label}
                    </label>
                    <button type="button" onClick={() => onOpenImage(tipo.image)}
                      className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded">
                      Ver imagen
                    </button>
                  </div>
                ))}
              </div>
              {errores[errorInsectoKey] && (
                <p className="text-red-600 text-xs mt-1">{errores[errorInsectoKey]}</p>
              )}

              {insectoTiposArray.includes('compsus') && (
                <CompsusSection
                  basePrefix={basePrefix} cuadrante={cuadrante} rama={rama}
                  caracterizacion={caracterizacion} onCampoChange={onCampoChange}
                  errores={errores} clearErrorsForPrefix={clearErrorsForPrefix}
                />
              )}
              {insectoTiposArray.includes('diaphorina') && (
                <DiaphorinaSection
                  basePrefix={basePrefix} cuadrante={cuadrante} rama={rama}
                  caracterizacion={caracterizacion} onCampoChange={onCampoChange}
                  errores={errores} clearErrorsForPrefix={clearErrorsForPrefix}
                />
              )}
              {insectoTiposArray.includes('phyllocnistis') && (
                <PhyllocnistisSection
                  basePrefix={basePrefix} cuadrante={cuadrante} rama={rama}
                  caracterizacion={caracterizacion} onCampoChange={onCampoChange}
                  errores={errores} clearErrorsForPrefix={clearErrorsForPrefix}
                />
              )}
              {insectoTiposArray.includes('toxoptera') && (
                <ToxopteraSection
                  basePrefix={basePrefix} cuadrante={cuadrante} rama={rama}
                  caracterizacion={caracterizacion} onCampoChange={onCampoChange}
                  errores={errores} clearErrorsForPrefix={clearErrorsForPrefix}
                />
              )}
            </div>
          )}

          {/* Ácaros */}
          {isAracnido && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccione el ácaro que ocasionó el daño en los frutos de la RAMA {rama} del CUADRANTE {cuadrante} (Selección múltiple)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                {acaroTiposDisponibles.map(tipo => (
                  <div key={tipo.value} className="flex items-center gap-2">
                    <label className="inline-flex items-center">
                      <input type="checkbox" checked={acaroTiposArray.includes(tipo.value)}
                        onChange={(e) => handleAcaroTipoChange(tipo.value, e.target.checked)} className="mr-2" />
                      {tipo.label}
                    </label>
                    <button type="button" onClick={() => onOpenImage(tipo.image)}
                      className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded">
                      Ver imagen
                    </button>
                  </div>
                ))}
              </div>
              {errores[errorAcaroKey] && (
                <p className="text-red-600 text-xs mt-1">{errores[errorAcaroKey]}</p>
              )}

              {acaroTiposArray.includes('polyphagotarsonemus') && (
                <PolyphagotarsonemusSection
                  basePrefix={basePrefix} cuadrante={cuadrante} rama={rama}
                  caracterizacion={caracterizacion} onCampoChange={onCampoChange}
                  errores={errores} clearErrorsForPrefix={clearErrorsForPrefix}
                />
              )}
              {acaroTiposArray.includes('phyllocoptruta') && (
                <PhyllocoptrutaSection
                  basePrefix={basePrefix} cuadrante={cuadrante} rama={rama}
                  caracterizacion={caracterizacion} onCampoChange={onCampoChange}
                  errores={errores} clearErrorsForPrefix={clearErrorsForPrefix}
                />
              )}
            </div>
          )}

          {/* Otro artrópodo */}
          <div className="mt-4">
            <label className="inline-flex items-center mb-2">
              <input type="checkbox"
                checked={caracterizacion[`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_otro_activo`] === 'true'}
                onChange={(e) => {
                  onCampoChange(`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_otro_activo`, e.target.checked ? 'true' : 'false');
                  if (!e.target.checked) {
                    // Limpiar datos y errores de otro
                    const otroPrefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_otro`;
                    Object.keys(caracterizacion).forEach(k => {
                      if (k.startsWith(otroPrefix)) onCampoChange(k, "");
                    });
                    clearErrorsForPrefix(otroPrefix);
                  }
                }}
                className="mr-2" />
              <span className="text-sm font-medium text-gray-700">Registrar otro artrópodo no listado</span>
            </label>

            {caracterizacion[`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_otro_activo`] === 'true' && (
              <OtroArthropodSection
                basePrefix={basePrefix} cuadrante={cuadrante} rama={rama}
                caracterizacion={caracterizacion} onCampoChange={onCampoChange}
                errores={errores} clearErrorsForPrefix={clearErrorsForPrefix}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ── Subsecciones de insectos/ácaros con validación ─────────────────────────

// Ejemplo para CompsusSection (similar para las demás)
const CompsusSection: React.FC<{
  basePrefix: string; cuadrante: number; rama: number;
  caracterizacion: Record<string, string>;
  onCampoChange: (campo: string, valor: string) => void;
  errores: Record<string, string>;
  clearErrorsForPrefix: (prefix: string) => void;
}> = ({ basePrefix, cuadrante, rama, caracterizacion, onCampoChange, errores, clearErrorsForPrefix }) => {
  const prefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_compsus`;
  const adultosKey = `${prefix}_adultos`;
  const danoHojasKey = `${prefix}_dano_hojas`;

  const handleChange = (key: string, value: string) => {
    onCampoChange(key, value);
    // Limpiar error del campo específico cuando el usuario escribe
    clearErrorsForPrefix(key + "_error");
  };

  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
      <h6 className="font-semibold mb-2 text-sm">Monitoreo de <em>Compsus sp.</em> - Picudo</h6>
      <p className="text-xs text-gray-600 mb-2 italic">
        Seleccione preferiblemente árboles de los linderos, de los bordes de carretera o los que están cerca de los centros de acopio de frutas. Sacuda de forma suave las ramas de arriba hacia abajo, dándole la vuelta al árbol. Observe en el suelo la presencia de adultos.
      </p>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Adultos de <em>Compsus sp.</em> encontrados *</label>
        <input type="number" min="0" step="1"
          value={caracterizacion[adultosKey] || ""}
          onChange={(e) => handleChange(adultosKey, e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
          placeholder="Ej: 3 (0 si no hay)" required />
        <p className="text-xs text-gray-500 mt-1">De no encontrarse presencia del insecto, colocar 0</p>
        {errores[`${adultosKey}_error`] && (
          <p className="text-red-600 text-xs mt-1">{errores[`${adultosKey}_error`]}</p>
        )}
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">% de daño en hojas *</label>
        <input type="number" min="0" max="100" step="1"
          value={caracterizacion[danoHojasKey] || ""}
          onChange={(e) => handleChange(danoHojasKey, e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
          placeholder="Ej: 30 (0 si no hay daño)" required />
        <p className="text-xs text-gray-500 mt-1">De no encontrarse daño del insecto, colocar 0</p>
        {errores[`${danoHojasKey}_error`] && (
          <p className="text-red-600 text-xs mt-1">{errores[`${danoHojasKey}_error`]}</p>
        )}
      </div>
      <FotosSection prefix={`${prefix}_fotos`} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />
    </div>
  );
};

// De manera similar se modifican DiaphorinaSection, PhyllocnistisSection, ToxopteraSection,
// PolyphagotarsonemusSection, PhyllocoptrutaSection y OtroArthropodSection.
// Cada una recibe errores y clearErrorsForPrefix y muestra los mensajes de error junto a los campos requeridos.

// ── Sección "Otro artrópodo" con validación ────────────────────────────────

const OtroArthropodSection: React.FC<{
  basePrefix: string; cuadrante: number; rama: number;
  caracterizacion: Record<string, string>;
  onCampoChange: (campo: string, valor: string) => void;
  errores: Record<string, string>;
  clearErrorsForPrefix: (prefix: string) => void;
}> = ({ basePrefix, cuadrante, rama, caracterizacion, onCampoChange, errores, clearErrorsForPrefix }) => {
  const prefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_otro`;
  const sintomasKey = `${prefix}_sintomas`;
  const claseKey = `${prefix}_clase`;
  const nombreKey = `${prefix}_nombre`;

  const handleChange = (key: string, value: string) => {
    onCampoChange(key, value);
    clearErrorsForPrefix(key + "_error");
  };

  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
      <h6 className="font-semibold mb-2 text-sm">Otro artrópodo observado</h6>

      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Síntomas observados *</label>
        <input type="text"
          value={caracterizacion[sintomasKey] || ""}
          onChange={(e) => handleChange(sintomasKey, e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
          placeholder="Describa los síntomas observados" required />
        {errores[`${sintomasKey}_error`] && (
          <p className="text-red-600 text-xs mt-1">{errores[`${sintomasKey}_error`]}</p>
        )}
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">Clase de artrópodo observado *</label>
        <div className="flex gap-4">
          {["Insecto", "Ácaro"].map((opcion) => (
            <label key={opcion} className="inline-flex items-center">
              <input type="radio" name={claseKey} value={opcion}
                checked={caracterizacion[claseKey] === opcion}
                onChange={(e) => handleChange(claseKey, e.target.value)}
                className="mr-2" required />
              {opcion}
            </label>
          ))}
        </div>
        {errores[`${claseKey}_error`] && (
          <p className="text-red-600 text-xs mt-1">{errores[`${claseKey}_error`]}</p>
        )}
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre del artrópodo observado (mínimo hasta género) *
        </label>
        <input type="text"
          value={caracterizacion[nombreKey] || ""}
          onChange={(e) => handleChange(nombreKey, e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
          placeholder="Ej: Atta sp." required />
        {errores[`${nombreKey}_error`] && (
          <p className="text-red-600 text-xs mt-1">{errores[`${nombreKey}_error`]}</p>
        )}
      </div>

      <RealFotosSection
        prefix={`${prefix}_fotos`}
        caracterizacion={caracterizacion}
        onCampoChange={onCampoChange}
      />
    </div>
  );
};

// ── Componente principal ArthropodSection con lógica de validación mejorada ──

export const ArthropodSection = forwardRef<ArthropodSectionRef, Props>(
  ({ plantas, caracterizacion, onCampoChange }, ref) => {
    const [modalImage, setModalImage] = useState<string | null>(null);
    const [errores, setErrores] = useState<Record<string, string>>({});

    // Función para limpiar errores cuyo key empiece con un prefijo
    const clearErrorsForPrefix = (prefix: string) => {
      setErrores(prev => {
        const newErrores = { ...prev };
        Object.keys(newErrores).forEach(key => {
          if (key.startsWith(prefix)) {
            delete newErrores[key];
          }
        });
        return newErrores;
      });
    };

    const validate = (): boolean => {
      const nuevosErrores: Record<string, string> = {};
      let isValid = true;

      plantas.forEach((planta, idx) => {
        const basePrefix = `artropodo_planta_${idx + 1}`;
        for (let cuadrante = 1; cuadrante <= 4; cuadrante++) {
          const presenciaKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${cuadrante}_presencia`;
          const presencia = caracterizacion[presenciaKey] || "";
          const errorPresenciaKey = `${presenciaKey}_error`;

          if (!presencia) {
            nuevosErrores[errorPresenciaKey] = "Debe indicar si hay presencia de artrópodos en esta rama.";
            isValid = false;
          } else if (presencia === "si") {
            // Verificar que al menos una clase esté seleccionada
            const claseKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${cuadrante}_clase`;
            const claseString = caracterizacion[claseKey] || "";
            const errorClaseKey = `${claseKey}_error`;
            if (!claseString) {
              nuevosErrores[errorClaseKey] = "Debe seleccionar al menos una clase (Insecto o Arácnido).";
              isValid = false;
            } else {
              // Validar insectos si están seleccionados
              if (claseString.includes('insecto')) {
                const insectoTiposKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${cuadrante}_insecto_tipos`;
                const insectoTipos = (caracterizacion[insectoTiposKey] || "").split(",").filter(Boolean);
                const otroActivoKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${cuadrante}_otro_activo`;
                const otroActivo = caracterizacion[otroActivoKey] === "true";
                const errorInsectoKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${cuadrante}_insecto_error`;
                if (insectoTipos.length === 0 && !otroActivo) {
                  nuevosErrores[errorInsectoKey] = "Debe seleccionar al menos un insecto o marcar 'Registrar otro artrópodo no listado'.";
                  isValid = false;
                } else {
                  // Validar cada insecto seleccionado
                  insectoTipos.forEach(tipo => {
                    const tipoPrefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${cuadrante}_insecto_${tipo}`;
                    // Compsus
                    if (tipo === 'compsus') {
                      const adultosKey = `${tipoPrefix}_adultos`;
                      const danoKey = `${tipoPrefix}_dano_hojas`;
                      if (!caracterizacion[adultosKey] && caracterizacion[adultosKey] !== "0") {
                        nuevosErrores[`${adultosKey}_error`] = "Campo obligatorio. Ingrese 0 si no hay.";
                        isValid = false;
                      }
                      if (!caracterizacion[danoKey] && caracterizacion[danoKey] !== "0") {
                        nuevosErrores[`${danoKey}_error`] = "Campo obligatorio. Ingrese 0 si no hay daño.";
                        isValid = false;
                      }
                    }
                    // Diaphorina
                    if (tipo === 'diaphorina') {
                      const adultosKey = `${tipoPrefix}_adultos`;
                      const estadosKey = `${tipoPrefix}_estados`;
                      if (!caracterizacion[adultosKey] && caracterizacion[adultosKey] !== "0") {
                        nuevosErrores[`${adultosKey}_error`] = "Campo obligatorio. Ingrese 0 si no hay.";
                        isValid = false;
                      }
                      if (!caracterizacion[estadosKey]) {
                        nuevosErrores[`${estadosKey}_error`] = "Debe seleccionar al menos un estado del insecto.";
                        isValid = false;
                      }
                    }
                    // Phyllocnistis
                    if (tipo === 'phyllocnistis') {
                      const galeriasKey = `${tipoPrefix}_galerias`;
                      const danoKey = `${tipoPrefix}_dano_hojas`;
                      if (!caracterizacion[galeriasKey] && caracterizacion[galeriasKey] !== "0") {
                        nuevosErrores[`${galeriasKey}_error`] = "Campo obligatorio. Ingrese 0 si no hay.";
                        isValid = false;
                      }
                      if (!caracterizacion[danoKey] && caracterizacion[danoKey] !== "0") {
                        nuevosErrores[`${danoKey}_error`] = "Campo obligatorio. Ingrese 0 si no hay daño.";
                        isValid = false;
                      }
                    }
                    // Toxoptera
                    if (tipo === 'toxoptera') {
                      const adultosKey = `${tipoPrefix}_adultos`;
                      const mielecillaKey = `${tipoPrefix}_mielecilla`;
                      const fumaginaKey = `${tipoPrefix}_dano_fumagina`;
                      if (!caracterizacion[adultosKey] && caracterizacion[adultosKey] !== "0") {
                        nuevosErrores[`${adultosKey}_error`] = "Campo obligatorio. Ingrese 0 si no hay.";
                        isValid = false;
                      }
                      if (!caracterizacion[mielecillaKey]) {
                        nuevosErrores[`${mielecillaKey}_error`] = "Debe indicar si se observó mielecilla y fumagina.";
                        isValid = false;
                      }
                      if (!caracterizacion[fumaginaKey] && caracterizacion[fumaginaKey] !== "0") {
                        nuevosErrores[`${fumaginaKey}_error`] = "Campo obligatorio. Ingrese 0 si no hay daño.";
                        isValid = false;
                      }
                    }
                  });
                }
              }
              // Validar ácaros si están seleccionados
              if (claseString.includes('aracnido')) {
                const acaroTiposKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${cuadrante}_acaro_tipos`;
                const acaroTipos = (caracterizacion[acaroTiposKey] || "").split(",").filter(Boolean);
                const otroActivoKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${cuadrante}_otro_activo`;
                const otroActivo = caracterizacion[otroActivoKey] === "true";
                const errorAcaroKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${cuadrante}_acaro_error`;
                if (acaroTipos.length === 0 && !otroActivo) {
                  nuevosErrores[errorAcaroKey] = "Debe seleccionar al menos un ácaro o marcar 'Registrar otro artrópodo no listado'.";
                  isValid = false;
                } else {
                  acaroTipos.forEach(tipo => {
                    const tipoPrefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${cuadrante}_acaro_${tipo}`;
                    if (tipo === 'polyphagotarsonemus') {
                      const frutosKey = `${tipoPrefix}_frutos_afectados`;
                      const danoKey = `${tipoPrefix}_dano_frutos`;
                      if (!caracterizacion[frutosKey] && caracterizacion[frutosKey] !== "0") {
                        nuevosErrores[`${frutosKey}_error`] = "Campo obligatorio. Ingrese 0 si no hay.";
                        isValid = false;
                      }
                      if (!caracterizacion[danoKey] && caracterizacion[danoKey] !== "0") {
                        nuevosErrores[`${danoKey}_error`] = "Campo obligatorio. Ingrese 0 si no hay daño.";
                        isValid = false;
                      }
                    }
                    if (tipo === 'phyllocoptruta') {
                      const frutosKey = `${tipoPrefix}_frutos_afectados`;
                      const danoKey = `${tipoPrefix}_dano_frutos`;
                      if (!caracterizacion[frutosKey] && caracterizacion[frutosKey] !== "0") {
                        nuevosErrores[`${frutosKey}_error`] = "Campo obligatorio. Ingrese 0 si no hay.";
                        isValid = false;
                      }
                      if (!caracterizacion[danoKey] && caracterizacion[danoKey] !== "0") {
                        nuevosErrores[`${danoKey}_error`] = "Campo obligatorio. Ingrese 0 si no hay daño.";
                        isValid = false;
                      }
                    }
                  });
                }
              }
              // Validar "Otro artrópodo" si está activo
              const otroActivoKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${cuadrante}_otro_activo`;
              if (caracterizacion[otroActivoKey] === "true") {
                const otroPrefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${cuadrante}_otro`;
                const sintomas = caracterizacion[`${otroPrefix}_sintomas`];
                const clase = caracterizacion[`${otroPrefix}_clase`];
                const nombre = caracterizacion[`${otroPrefix}_nombre`];
                if (!sintomas) {
                  nuevosErrores[`${otroPrefix}_sintomas_error`] = "Debe describir los síntomas observados.";
                  isValid = false;
                }
                if (!clase) {
                  nuevosErrores[`${otroPrefix}_clase_error`] = "Debe seleccionar la clase del artrópodo.";
                  isValid = false;
                }
                if (!nombre) {
                  nuevosErrores[`${otroPrefix}_nombre_error`] = "Debe indicar el nombre del artrópodo (mínimo género).";
                  isValid = false;
                }
                // Nota: las fotos no se validan como obligatorias
              }
            }
          }
        }
      });

      setErrores(nuevosErrores);
      if (!isValid) {
        toast.error("Por favor complete los campos obligatorios según las opciones seleccionadas.");
      }
      return isValid;
    };

    useImperativeHandle(ref, () => ({
      validate
    }));

    return (
      <div className="bg-gray-50 p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Monitoreo de Artrópodos</h2>
        <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
          <p className="text-sm text-gray-700">
            <span className="font-bold">Metodología de monitoreo:</span> Para cada árbol seleccionado, divida la copa en 4 cuadrantes.
            Seleccione una rama al azar de cada cuadrante. Observe: daño en hojas, frutos, puntos de crecimiento y presencia de artrópodos.
          </p>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">Árboles seleccionados para monitoreo</h3>
        <p className="text-sm text-gray-600 mb-6">
          Se han generado {plantas.length} árbol(es) para monitoreo. Para cada uno, evalúe los 4 cuadrantes de forma independiente.
        </p>
        {plantas.map((planta, idx) => (
          <PlantaArthropod
            key={planta.codigo}
            index={idx}
            planta={planta}
            caracterizacion={caracterizacion}
            onCampoChange={onCampoChange}
            onOpenImage={(name) => setModalImage(`/imgs/${name}`)}
            errores={errores}
            clearErrorsForPrefix={clearErrorsForPrefix}
          />
        ))}
        <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-sm text-gray-700">
          <p className="font-medium mb-1">📝 Nota importante - Variedad Swingle:</p>
          <p>
            Si el lote monitoreado tiene o linda con plantas de la variedad Swingle (Lotes: 5, 6, 8 y 9),
            debe monitorear mínimo 2 árboles adicionales de esta variedad para el monitoreo de <em>Diaphorina citri</em>.
          </p>
        </div>
        <ImageModal imageUrl={modalImage} onClose={() => setModalImage(null)} />
      </div>
    );
  }
);