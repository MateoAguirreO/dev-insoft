<script lang="ts">
   import { Button, H1, Iconify, Input, InputPass, Text, toastError } from "@ingenieria_insoft/ispsveltecomponents";
   import { TSesionClient } from "$lib/1.api/Leads_SesionCliente";
   import { LongitudUsuario, RutaInicio } from "$lib/const";
   import { mensajeError } from "$lib/utils";

   // Ruta validada en el servidor (login.astro): solo puede ser del mismo sitio
   export let volver: string = RutaInicio;

   const Controller: TSesionClient = new TSesionClient();

   let usuario: string = "";
   let clave: string = "";
   let bIngresando: boolean = false;

   async function ingresar(): Promise<void> {
      if (bIngresando) return;
      bIngresando = true;
      try {
         await Controller.Ingresar(usuario, clave);
         window.location.assign(volver);
      } catch (error) {
         clave = "";
         toastError(mensajeError(error, "No pudimos iniciar tu sesión. Inténtalo de nuevo."));
         bIngresando = false;
      }
   }
</script>

<!-- Ingreso con usuario y clave; el token queda en una cookie que solo lee el servidor de la web -->
<section class="mx-auto flex w-full max-w-sm flex-col gap-6 py-10">
   <div class="flex flex-col gap-1 text-center">
      <H1 color="color" class="text-2xl font-bold">Inicia sesión</H1>
      <Text color="neutral" class="text-sm">Entra con tu usuario y tu clave para ver tus leads.</Text>
   </div>
   <form
      class="flex flex-col gap-4 rounded-lg border border-(--is-b-color) bg-(--is-bg-secondary) p-6"
      on:submit|preventDefault={ingresar}
   >
      <Input label="Usuario" maxLength={LongitudUsuario} bind:value={usuario} />
      <InputPass label="Clave" bind:value={clave} />
      <Button type="submit" loading={bIngresando}>
         <Iconify icon="mdi:login" slot="icon" />
         Ingresar
      </Button>
   </form>
</section>
