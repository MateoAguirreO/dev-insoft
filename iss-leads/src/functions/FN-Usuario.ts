import { registerCatalogoGenAzureFunction } from "@ingenieria_insoft/ispazureutils";
import { TUsuario } from "../sources/010 Objetos/040_UlUsuario";
import { TUsuarioController } from "../sources/020 Controllers/040_UlUsuarioServer";

// Solo CRUD: verificar, duplicar, recodificar y consolidar no aplican a usuarios.
registerCatalogoGenAzureFunction(TUsuarioController, TUsuario, {
  pk: ["iusuario"],
  nrecurso: "usuario",
  nrecursos: "usuarios",
  omitir: ["Verificar", "Duplicar", "Recodificar", "Consolidar"],
  paths: {
    obtener: "usuarios/{iusuario}",
    insertar: "usuarios",
    modificar: "usuarios/{iusuario}",
    eliminar: "usuarios/{iusuario}",
    listar: "usuarios",
  },
});
