import React from "react";
import { PlantaFenologico } from "../types";

interface Props {
  plantas: PlantaFenologico[];
  caracterizacion: Record<string, string>;
  onCampoChange: (campo: string, valor: string) => void;
  // onFaseChange ya no se utiliza; todo se maneja con onCampoChange
}

export const FenologicoSection: React.FC<Props> = ({
  plantas,
  caracterizacion,
  onCampoChange,
}) => {
  // Función auxiliar para generar la clave de un campo
  const getKey = (plantaIdx: number, ramaIdx: number, campo: string) =>
    `fenologico_planta_${plantaIdx + 1}_rama_${ramaIdx + 1}_${campo}`;

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Monitoreo Fenológico
      </h2>

      <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
        <p className="text-sm text-gray-700">
          <span className="font-bold">Metodología:</span> Para cada árbol, divida la copa en 4 cuadrantes.
          Seleccione una rama terminal de aproximadamente 50 cm en cada cuadrante. Evalúe cada rama
          de forma independiente, registrando la fase fenológica predominante y los parámetros
          correspondientes.
        </p>
      </div>

      <h3 className="text-xl font-bold text-gray-800 mb-4 mt-8">
        Plantas seleccionadas para monitoreo fenológico
      </h3>
      <p className="text-sm text-gray-600 mb-6">
        Las siguientes {plantas.length} plantas han sido generadas. Para cada una, evalúe las 4 ramas (una por cuadrante).
      </p>

      {plantas.map((planta, idxPlanta) => {
        const i = idxPlanta + 1; // Número de planta para mostrar

        return (
          <div
            key={planta.codigo}
            className="border rounded-lg p-4 mb-8 bg-white shadow-sm"
          >
            <h4 className="font-semibold text-lg text-gray-800 mb-2">
              {planta.label} (Código: {planta.codigo})
            </h4>
            <p className="text-sm text-gray-500 mb-4">
              Evalúe cada una de las 4 ramas (cuadrantes)
            </p>

            {/* Generar las 4 ramas */}
            {[1, 2, 3, 4].map((ramaNum) => {
              const j = ramaNum; // 1-indexed
              const faseKey = getKey(idxPlanta, j, "fase");
              const faseActual = caracterizacion[faseKey] || "";

              // Claves específicas para cada fase
              const totalPuntosKey = getKey(idxPlanta, j, "total_puntos_crecimiento");
              const bbchVegKey = getKey(idxPlanta, j, "bbch_vegetativo");
              const totalFloresKey = getKey(idxPlanta, j, "total_flores");
              const bbchFlorKey = getKey(idxPlanta, j, "bbch_floracion");
              const totalFrutosKey = getKey(idxPlanta, j, "total_frutos");
              const canicaKey = getKey(idxPlanta, j, "frutos_canica");
              const pinponKey = getKey(idxPlanta, j, "frutos_pinpon");
              const bolaTenisKey = getKey(idxPlanta, j, "frutos_bola_tenis");
              const cuartoKey = getKey(idxPlanta, j, "frutos_cuarto");
              const bbchFrucKey = getKey(idxPlanta, j, "bbch_fructificacion");

              return (
                <div
                  key={`${planta.codigo}-rama-${j}`}
                  className="ml-4 mb-6 p-3 border-l-4 border-blue-200 bg-gray-50 rounded"
                >
                  <h5 className="font-medium text-md text-gray-700 mb-3">
                    Rama {j} (Cuadrante {j})
                  </h5>

                  {/* Selector de fase para esta rama */}
                  <div className="mb-4 max-w-xs">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fase fenológica de la rama
                    </label>
                    <select
                      value={faseActual}
                      onChange={(e) => onCampoChange(faseKey, e.target.value)}
                      className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                    >
                      <option value="" disabled>
                        -- Seleccione una fase --
                      </option>
                      <option value="vegetativa">Vegetativa</option>
                      <option value="floracion">Floración</option>
                      <option value="fructificacion">Fructificación</option>
                    </select>
                  </div>

                  {/* Campos según fase seleccionada */}
                  {faseActual === "vegetativa" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">
                          Número total de puntos de crecimiento evaluados
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          name={totalPuntosKey}
                          value={caracterizacion[totalPuntosKey] || ""}
                          onChange={(e) => onCampoChange(totalPuntosKey, e.target.value)}
                          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Ej: 45"
                          required
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">
                          Estado BBCH predominante
                        </label>
                        <select
                          name={bbchVegKey}
                          value={caracterizacion[bbchVegKey] || ""}
                          onChange={(e) => onCampoChange(bbchVegKey, e.target.value)}
                          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="" disabled>Seleccione</option>
                          <option value="09">09: Los primordios foliares son visibles</option>
                          <option value="10">10: Las primeras hojas empiezan a separarse</option>
                          <option value="15">15: Se hacen visibles más hojas, pero sin alcanzar su tamaño final</option>
                          <option value="19">19: Las hojas alcanzan su tamaño final</option>
                          <option value="31">31: Empieza a crecer el brote: se hace visible su tallo</option>
                          <option value="32">32: Los brotes alcanzan alrededor del 20% de su tamaño final</option>
                          <option value="39">39: Los brotes alcanzan alrededor del 90% de su tamaño final</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {faseActual === "floracion" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">
                          Número total de flores evaluadas
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          name={totalFloresKey}
                          value={caracterizacion[totalFloresKey] || ""}
                          onChange={(e) => onCampoChange(totalFloresKey, e.target.value)}
                          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Ej: 30"
                          required
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">
                          Estado BBCH predominante
                        </label>
                        <select
                          name={bbchFlorKey}
                          value={caracterizacion[bbchFlorKey] || ""}
                          onChange={(e) => onCampoChange(bbchFlorKey, e.target.value)}
                          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="" disabled>Seleccione</option>
                          <option value="51">51: Se hacen visibles las escamas ligeramente verdes</option>
                          <option value="53">53: Las escamas se separan y se hacen visibles los primordios florales</option>
                          <option value="55">55: Las flores se hacen visibles: están todavía cerradas (botón verde)</option>
                          <option value="56">56: Los pétalos crecen (botón blanco)</option>
                          <option value="57">57: Apertura de sépalos con pétalos visibles aún cerrados</option>
                          <option value="59">59: Flores mayoritariamente con pétalos cerrados</option>
                          <option value="60">60: Se abren las primeras flores</option>
                          <option value="61">61: Comienza la floración: alrededor del 10% de las flores están abiertas</option>
                          <option value="65">65: Plena floración: alrededor del 50% de las flores están abiertas</option>
                          <option value="67">67: Las flores se marchitan: la mayoría de los pétalos están cayendo</option>
                          <option value="69">69: Fin de la floración: han caído todos los pétalos</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {faseActual === "fructificacion" && (
                    <div className="space-y-4 mt-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <label className="text-sm font-medium text-gray-700 mb-1">
                            Número total de frutos observados
                          </label>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            name={totalFrutosKey}
                            value={caracterizacion[totalFrutosKey] || ""}
                            onChange={(e) => onCampoChange(totalFrutosKey, e.target.value)}
                            className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ej: 50"
                            required
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-sm font-medium text-gray-700 mb-1">
                            Frutos tipo canica
                          </label>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            name={canicaKey}
                            value={caracterizacion[canicaKey] || ""}
                            onChange={(e) => onCampoChange(canicaKey, e.target.value)}
                            className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ej: 10"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col">
                          <label className="text-sm font-medium text-gray-700 mb-1">
                            Frutos tipo pin-pon
                          </label>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            name={pinponKey}
                            value={caracterizacion[pinponKey] || ""}
                            onChange={(e) => onCampoChange(pinponKey, e.target.value)}
                            className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ej: 15"
                            required
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-sm font-medium text-gray-700 mb-1">
                            Frutos tipo bola de tenis
                          </label>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            name={bolaTenisKey}
                            value={caracterizacion[bolaTenisKey] || ""}
                            onChange={(e) => onCampoChange(bolaTenisKey, e.target.value)}
                            className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ej: 12"
                            required
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-sm font-medium text-gray-700 mb-1">
                            Frutos 1/4 de maduración
                          </label>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            name={cuartoKey}
                            value={caracterizacion[cuartoKey] || ""}
                            onChange={(e) => onCampoChange(cuartoKey, e.target.value)}
                            className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ej: 8"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex flex-col md:w-1/3 mt-2">
                        <label className="text-sm font-medium text-gray-700 mb-1">
                          Estado BBCH predominante
                        </label>
                        <select
                          name={bbchFrucKey}
                          value={caracterizacion[bbchFrucKey] || ""}
                          onChange={(e) => onCampoChange(bbchFrucKey, e.target.value)}
                          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="" disabled>Seleccione</option>
                          <option value="71">71: Cuajado: el ovario empieza a crecer</option>
                          <option value="72">72: El fruto, verde, está rodeado por los sépalos</option>
                          <option value="73">73: Algunos frutos amarillean: caída fisiológica</option>
                          <option value="74">74: Fruto al 40% del tamaño final, color verde oscuro</option>
                          <option value="79">79: El fruto alcanza alrededor del 90% de su tamaño final</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};