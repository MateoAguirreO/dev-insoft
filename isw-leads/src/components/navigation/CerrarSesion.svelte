<script lang="ts">
   import { Button, Iconify, toastError } from "@ingenieria_insoft/ispsveltecomponents";
   import { TSesionClient } from "$lib/1.api/Leads_SesionCliente";
   import { RutaLogin } from "$lib/const";
   import { mensajeError } from "$lib/utils";

   const Controller: TSesionClient = new TSesionClient();

   let bSaliendo: boolean = false;

   async function salir(): Promise<void> {
      if (bSaliendo) return;
      bSaliendo = true;
      try {
         await Controller.Salir();
         window.location.assign(RutaLogin);
      } catch (error) {
         toastError(mensajeError(error, "No pudimos cerrar tu sesión. Inténtalo de nuevo."));
         bSaliendo = false;
      }
   }
</script>

<!-- Cierra la sesión en el API y borra la cookie; el encabezado es oscuro, así que el botón va en blanco -->
<Button variant="outlined" class="w-auto! px-3! text-sm" style="--bttn-clr: #ffffff" loading={bSaliendo} onClick={salir}>
   <Iconify icon="mdi:logout" slot="icon" />
   Cerrar sesión
</Button>
