<script lang="ts">
   import {
      Button, H1, H2, Iconify, Input, Modal, SelectObject, Spinner, Text, TextArea, toastError, toastSuccess
   } from "@ingenieria_insoft/ispsveltecomponents";
   import { val2Int, type TListaPaginacion } from "@ingenieria_insoft/ispgen";
   import AvisoError from "$components/display/AvisoError.svelte";
   import { TLeadsClient } from "$lib/2.leads/Leads_Lead";
   import { TLeadMensajesClient } from "$lib/2.leads/Leads_LeadMensaje";
   import { LongitudAsunto } from "$lib/const";
   import type { TLead } from "$lib/ispleads/010 Objetos/TLead";
   import type { TLeadCorreo } from "$lib/ispleads/010 Objetos/TLeadCorreo";
   import { TLeadMensaje } from "$lib/ispleads/010 Objetos/TLeadMensaje";
   import { formatoFechaHora, mensajeError } from "$lib/utils";

   export let ilead: number = 0;

   const ControllerLead: TLeadsClient = new TLeadsClient();
   const Controller: TLeadMensajesClient = new TLeadMensajesClient();

   let Lead: TLead | undefined = undefined;
   let errorLead: string = "";
   let bCargandoLead: boolean = false;
   let OpcionesCorreo: Record<string, TLeadCorreo> = {};

   let Lista: TListaPaginacion<TLeadMensaje> | undefined = undefined;
   let pagina: number = 1;
   let bCargandoLista: boolean = false;
   let errorLista: string = "";
   let consecutivo: number = 0;

   let Nuevo: TLeadMensaje = nuevoMensaje();
   let bRegistrando: boolean = false;

   let Detalle: TLeadMensaje | undefined = undefined;
   let errorDetalle: string = "";
   let bShowDetalle: boolean = false;

   iniciar();

   async function iniciar(): Promise<void> {
      if (!(ilead > 0)) {
         errorLead = "Este código de lead no es válido. Vuelve al listado y elige uno.";
         return;
      }
      await Promise.all([cargarLead(), cargarMensajes(1)]);
   }

   async function cargarLead(): Promise<void> {
      bCargandoLead = true;
      errorLead = "";
      try {
         Lead = await ControllerLead.Obtener(ilead);
         const opciones: Record<string, TLeadCorreo> = {};
         for (const Correo of Lead.correos) opciones[Correo.email] = Correo;
         OpcionesCorreo = opciones;
         Nuevo = nuevoMensaje();
      } catch (error) {
         errorLead = mensajeError(error, "No pudimos cargar los datos del lead.");
      } finally {
         bCargandoLead = false;
      }
   }

   async function cargarMensajes(paginaPedida: number): Promise<void> {
      const idPeticion: number = ++consecutivo;
      bCargandoLista = true;
      try {
         const Resultado: TListaPaginacion<TLeadMensaje> = await Controller.Lista(ilead, paginaPedida);
         if (idPeticion !== consecutivo) return;
         Lista = Resultado;
         pagina = val2Int(Resultado.pagina, paginaPedida);
         errorLista = "";
      } catch (error) {
         if (idPeticion !== consecutivo) return;
         errorLista = mensajeError(error, "No pudimos cargar los mensajes de este lead.");
      } finally {
         if (idPeticion === consecutivo) bCargandoLista = false;
      }
   }

   // El destinatario arranca en el correo principal, o en el primero si ninguno lo es
   function nuevoMensaje(): TLeadMensaje {
      const correos: Array<TLeadCorreo> = Lead ? Array.from(Lead.correos) : [];
      const Principal: TLeadCorreo | undefined = correos.find((Correo: TLeadCorreo): boolean => Correo.bprincipal) ?? correos[0];
      return TLeadMensaje.JSONToObject<TLeadMensaje>({ ilead, email: Principal ? Principal.email : "", asunto: "", cuerpo: "" });
   }

   function captionCorreo(Correo: TLeadCorreo): string {
      return Correo.bprincipal ? `${Correo.email} (principal)` : Correo.email;
   }

   async function registrar(): Promise<void> {
      if (bRegistrando) return;
      bRegistrando = true;
      try {
         await Controller.Registrar(Nuevo);
         toastSuccess("¡Listo! Registramos el mensaje.");
         Nuevo = nuevoMensaje();
         await cargarMensajes(1);
      } catch (error) {
         toastError(mensajeError(error, "No pudimos registrar el mensaje. Inténtalo de nuevo."));
      } finally {
         bRegistrando = false;
      }
   }

   async function abrirDetalle(Mensaje: TLeadMensaje): Promise<void> {
      Detalle = undefined;
      errorDetalle = "";
      bShowDetalle = true;
      try {
         Detalle = await Controller.Obtener(ilead, Mensaje.imensaje);
      } catch (error) {
         errorDetalle = mensajeError(error, "No pudimos abrir este mensaje.");
      }
   }
</script>

<section class="flex flex-col gap-4">
   <div class="flex flex-wrap gap-4 text-sm">
      <a href="/leads" class="flex items-center gap-1 text-azul-oscuro hover:underline">
         <Iconify icon="mdi:arrow-left" />
         Volver a tus leads
      </a>
      {#if ilead > 0}
         <a href="/leads/{ilead}" class="flex items-center gap-1 text-azul-oscuro hover:underline">
            <Iconify icon="mdi:account-outline" />
            Ver la ficha del lead
         </a>
      {/if}
   </div>

   {#if bCargandoLead}
      <div class="flex flex-col items-center gap-2 py-12">
         <Spinner class="text-2xl" />
         <Text color="neutral" class="text-sm">Cargando el lead...</Text>
      </div>
   {:else if !Lead}
      <AvisoError mensaje={errorLead} onReintentar={ilead > 0 ? iniciar : undefined} />
   {:else}
      <div>
         <H1 color="color" class="text-2xl font-bold">Mensajes de {Lead.nombre || "este lead"}</H1>
         <Text color="neutral" class="text-sm">Aquí registras los mensajes que le enviaste y consultas su historial.</Text>
      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
         <div class="flex flex-col gap-3 lg:col-span-2">
            <H2 color="color" class="text-lg font-semibold">Mensajes enviados</H2>
            {#if errorLista && Lista}
               <Text color="error" class="text-sm" role="alert">{errorLista}</Text>
            {/if}
            {#if !Lista && bCargandoLista}
               <div class="flex justify-center py-8"><Spinner class="text-2xl" /></div>
            {:else if !Lista}
               <AvisoError mensaje={errorLista} onReintentar={() => cargarMensajes(pagina)} />
            {:else if Lista.datos.length === 0}
               <div class="rounded-lg border border-(--is-b-color) p-6 text-center">
                  <Text color="neutral">Todavía no hay mensajes registrados para este lead.</Text>
               </div>
            {:else}
               <div class="overflow-x-auto rounded-lg border border-(--is-b-color)" class:opacity-60={bCargandoLista}>
                  <table class="w-full text-left text-sm">
                     <thead class="bg-(--is-bg-secondary) text-xs uppercase">
                        <tr>
                           <th class="px-3 py-2">Fecha de envío</th>
                           <th class="px-3 py-2">Asunto</th>
                           <th class="px-3 py-2">Destinatario</th>
                        </tr>
                     </thead>
                     <tbody>
                        {#each Lista.datos as Mensaje (Mensaje.imensaje)}
                           <tr class="border-t border-(--is-b-color) hover:bg-(--is-bg-secondary)">
                              <td class="whitespace-nowrap px-3 py-2">{formatoFechaHora(Mensaje.fhenvio)}</td>
                              <td class="px-3 py-2">
                                 <button type="button" class="text-left font-semibold text-azul-oscuro hover:underline" on:click={() => abrirDetalle(Mensaje)}>
                                    {Mensaje.asunto || "(Sin asunto)"}
                                 </button>
                              </td>
                              <td class="px-3 py-2">{Mensaje.email}</td>
                           </tr>
                        {/each}
                     </tbody>
                  </table>
               </div>
               <div class="flex flex-wrap items-center justify-between gap-3">
                  <Text color="neutral" class="text-sm">
                     Página {pagina} de {Math.max(1, val2Int(Lista.totalpaginas))} · {val2Int(Lista.totalregistros)}
                     {val2Int(Lista.totalregistros) === 1 ? "mensaje" : "mensajes"}
                  </Text>
                  <div class="flex gap-2">
                     <Button variant="outlined" class="w-auto! px-3!" disabled={bCargandoLista || pagina <= 1} onClick={() => cargarMensajes(pagina - 1)}>
                        <Iconify icon="mdi:chevron-left" slot="icon" />
                        Anterior
                     </Button>
                     <Button variant="outlined" class="w-auto! px-3!" disabled={bCargandoLista || pagina >= val2Int(Lista.totalpaginas)} onClick={() => cargarMensajes(pagina + 1)}>
                        Siguiente
                        <Iconify icon="mdi:chevron-right" slot="icon" />
                     </Button>
                  </div>
               </div>
            {/if}
         </div>

         <div class="flex flex-col gap-3">
            <H2 color="color" class="text-lg font-semibold">Registrar un mensaje</H2>
            {#if Lead.correos.length === 0}
               <div class="rounded-lg border border-(--is-b-color) bg-(--is-bg-secondary) p-4">
                  <Text class="text-sm">
                     Este lead no tiene correos. <a href="/leads/{ilead}" class="font-semibold text-azul-oscuro hover:underline">Agrega uno en su ficha</a>
                     para poder registrar mensajes.
                  </Text>
               </div>
            {:else}
               <form class="flex flex-col gap-3 rounded-lg border border-(--is-b-color) bg-(--is-bg-secondary) p-4" on:submit|preventDefault={registrar}>
                  <SelectObject label="Destinatario" Options={OpcionesCorreo} fnCaption={captionCorreo} bind:value={Nuevo.email} />
                  <Input label="Asunto" maxLength={LongitudAsunto} bind:value={Nuevo.asunto} />
                  <TextArea label="Mensaje" required={false} bind:value={Nuevo.cuerpo} />
                  <Text color="neutral" class="text-xs">Registramos la fecha y hora de hoy como fecha de envío.</Text>
                  <Button type="submit" loading={bRegistrando}>
                     <Iconify icon="mdi:email-check-outline" slot="icon" />
                     Registrar mensaje
                  </Button>
               </form>
            {/if}
         </div>
      </div>
   {/if}
</section>

{#if bShowDetalle}
   <Modal bind:bshow={bShowDetalle}>
      <Text slot="title" class="font-semibold">Mensaje enviado</Text>
      <div class="flex w-[min(36rem,90vw)] flex-col gap-3 p-4">
         {#if Detalle}
            <div class="flex flex-col gap-1 text-sm">
               <Text><span class="font-semibold">Asunto:</span> {Detalle.asunto || "(Sin asunto)"}</Text>
               <Text><span class="font-semibold">Para:</span> {Detalle.email}</Text>
               <Text><span class="font-semibold">Enviado:</span> {formatoFechaHora(Detalle.fhenvio)}</Text>
            </div>
            <div class="whitespace-pre-wrap rounded-lg border border-(--is-b-color) bg-(--is-bg-primary) p-3 text-sm">
               {Detalle.cuerpo || "Este mensaje no tiene contenido."}
            </div>
         {:else if errorDetalle}
            <Text color="error" role="alert">{errorDetalle}</Text>
         {:else}
            <div class="flex justify-center py-6"><Spinner class="text-2xl" /></div>
         {/if}
      </div>
   </Modal>
{/if}
