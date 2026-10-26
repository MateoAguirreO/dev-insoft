<script lang="ts">
   import {
      Button, CheckBox, H1, Iconify, Input, ModalDuplicar, ModalEliminar, ModalRecodificar,
      SelectEnum, Spinner, Text, TextArea, toastError, toastSuccess
   } from "@ingenieria_insoft/ispsveltecomponents";
   import { isBool, val2Int } from "@ingenieria_insoft/ispgen";
   import AvisoError from "$components/display/AvisoError.svelte";
   import AvisoExito from "$components/display/AvisoExito.svelte";
   import { TLeadsClient } from "$lib/2.leads/Leads_Lead";
   import { LongitudTextoCorto, LongitudTextoLargo } from "$lib/const";
   import { TEstadoLead } from "$lib/ispleads/010 Objetos/TEstadoLead";
   import { TLead } from "$lib/ispleads/010 Objetos/TLead";
   import { mensajeError, navegarConAviso, tomarAviso } from "$lib/utils";
   import Correos from "./_Correos.svelte";

   export let ilead: number = 0;
   export let bNuevo: boolean = false;

   const Controller: TLeadsClient = new TLeadsClient();

   let Obj: TLead | undefined = undefined;
   let errorCarga: string = "";
   let bCargando: boolean = false;
   let bGuardando: boolean = false;
   // Al crear, el código es opcional: vacío significa que lo asigna el servicio
   let codigoNuevo: string = "";
   let bShowEliminar: boolean = false;
   let bShowDuplicar: boolean = false;
   let bShowRecodificar: boolean = false;

   // Confirmación que deja la página anterior al crear, duplicar o recodificar; se muestra en línea
   // y no como toast, porque la isla del Toaster puede montarse después que esta vista
   const aviso: string = tomarAviso();

   cargar();

   async function cargar(): Promise<void> {
      errorCarga = "";
      if (bNuevo) {
         Obj = TLead.JSONToObject<TLead>({
            nombre: "", empresa: "", cargo: "", telefono: "", ciudad: "", origen: "", observaciones: "",
            iestado: TEstadoLead.Nuevo, bactivo: true,
         });
         return;
      }
      if (!(ilead > 0)) {
         errorCarga = "Este código de lead no es válido. Vuelve al listado y elige uno.";
         return;
      }
      bCargando = true;
      try {
         Obj = await Controller.Obtener(ilead);
      } catch (error) {
         errorCarga = mensajeError(error, "No pudimos cargar este lead.");
      } finally {
         bCargando = false;
      }
   }

   async function guardar(): Promise<void> {
      if (!Obj || bGuardando) return;
      // Se envía una copia: si el servicio rechaza el código escrito, el formulario no queda con él
      const Datos: TLead = Obj.clone();
      if (bNuevo && isBool(codigoNuevo.trim())) {
         const codigo: number = val2Int(codigoNuevo);
         if (!(codigo > 0) || String(codigo) !== codigoNuevo.trim()) {
            toastError("El código debe ser un número entero mayor que cero. Si prefieres, déjalo vacío y lo asignamos por ti.");
            return;
         }
         Datos.ilead = codigo;
      }
      bGuardando = true;
      try {
         const Guardado: TLead = await Controller.Guardar(Datos, bNuevo);
         if (bNuevo) {
            navegarConAviso(Guardado.ilead > 0 ? `/leads/${Guardado.ilead}` : "/leads", "creado", true);
            return;
         }
         Obj = Guardado;
         toastSuccess("¡Listo! Guardamos los cambios.");
      } catch (error) {
         toastError(mensajeError(error, "No pudimos guardar el lead. Inténtalo de nuevo."));
      } finally {
         bGuardando = false;
      }
   }

   // Los modales anteponen «No se pudo …» al mensaje del servicio (por ejemplo, el lead tiene mensajes)
   function avisarError(mensaje: string): void {
      toastError(mensaje);
   }

   async function alEliminar(): Promise<void> {
      navegarConAviso("/leads", "eliminado", true);
   }

   async function alDuplicar(Nuevo: TLead): Promise<void> {
      navegarConAviso(`/leads/${Nuevo.ilead}`, "duplicado");
   }

   async function alRecodificar(Nuevo: TLead): Promise<void> {
      navegarConAviso(`/leads/${Nuevo.ilead}`, "recodificado", true);
   }
</script>

<section class="flex flex-col gap-4">
   <a href="/leads" class="flex w-fit items-center gap-1 text-sm text-azul-oscuro hover:underline">
      <Iconify icon="mdi:arrow-left" />
      Volver a tus leads
   </a>

   {#if isBool(aviso)}<AvisoExito mensaje={aviso} />{/if}

   {#if bCargando}
      <div class="flex flex-col items-center gap-2 py-12">
         <Spinner class="text-2xl" />
         <Text color="neutral" class="text-sm">Cargando el lead...</Text>
      </div>
   {:else if !Obj}
      <AvisoError mensaje={errorCarga} onReintentar={ilead > 0 ? cargar : undefined} />
   {:else}
      <div class="flex flex-wrap items-center justify-between gap-3">
         <div>
            <H1 color="color" class="text-2xl font-bold">{bNuevo ? "Nuevo lead" : Obj.nombre || "Lead sin nombre"}</H1>
            <Text color="neutral" class="text-sm">
               {bNuevo ? "Completa los datos de tu nuevo lead. Solo el nombre es obligatorio." : `Código ${Obj.ilead}`}
            </Text>
         </div>
         {#if !bNuevo}
            <a
               href="/leads/{Obj.ilead}/mensajes"
               class="flex items-center gap-2 rounded-lg border border-azul-oscuro px-4 py-2 text-sm font-semibold text-azul-oscuro hover:bg-(--is-bg-secondary)"
            >
               <Iconify icon="mdi:email-outline" />
               Ver mensajes
            </a>
         {/if}
      </div>

      <form class="flex flex-col gap-4" on:submit|preventDefault={guardar}>
         <div class="grid grid-cols-1 gap-4 rounded-lg border border-(--is-b-color) bg-(--is-bg-secondary) p-4 md:grid-cols-2">
            {#if bNuevo}
               <div class="flex flex-col gap-1">
                  <Input label="Código (opcional)" required={false} maxLength={Controller.sizePk} bind:value={codigoNuevo} />
                  <Text color="neutral" class="text-xs">Si lo dejas vacío, lo asignamos automáticamente.</Text>
               </div>
            {:else}
               <Input label="Código" readonly value={String(Obj.ilead)} />
            {/if}
            <Input label="Nombre" maxLength={LongitudTextoLargo} bind:value={Obj.nombre} />
            <Input label="Empresa" required={false} maxLength={LongitudTextoLargo} bind:value={Obj.empresa} />
            <Input label="Cargo" required={false} maxLength={LongitudTextoCorto} bind:value={Obj.cargo} />
            <Input label="Teléfono" required={false} maxLength={LongitudTextoCorto} bind:value={Obj.telefono} />
            <Input label="Ciudad" required={false} maxLength={LongitudTextoCorto} bind:value={Obj.ciudad} />
            <div class="flex flex-col gap-1">
               <Input label="Origen" required={false} maxLength={LongitudTextoCorto} bind:value={Obj.origen} />
               <Text color="neutral" class="text-xs">Por ejemplo: sitio web, referido o evento.</Text>
            </div>
            <SelectEnum label="Estado" enumValue={TEstadoLead} bind:value={Obj.iestado} />
            <div class="col-span-1 md:col-span-2">
               <TextArea label="Observaciones" required={false} bind:value={Obj.observaciones} />
            </div>
            <CheckBox bind:checked={Obj.bactivo}>Lead activo</CheckBox>
         </div>

         <div class="rounded-lg border border-(--is-b-color) bg-(--is-bg-secondary) p-4">
            <Correos bind:correos={Obj.correos} />
         </div>

         <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex flex-wrap gap-2">
               {#if !bNuevo}
                  <Button variant="outlined" class="w-auto! px-3!" disabled={bGuardando} onClick={() => (bShowDuplicar = true)}>
                     <Iconify icon="mdi:content-duplicate" slot="icon" />
                     Duplicar
                  </Button>
                  <Button variant="outlined" class="w-auto! px-3!" disabled={bGuardando} onClick={() => (bShowRecodificar = true)}>
                     <Iconify icon="mdi:key-variant" slot="icon" />
                     Recodificar
                  </Button>
                  <Button variant="outlined" color="danger" class="w-auto! px-3!" disabled={bGuardando} onClick={() => (bShowEliminar = true)}>
                     <Iconify icon="mdi:trash-can-outline" slot="icon" />
                     Eliminar
                  </Button>
               {/if}
            </div>
            <div class="flex gap-2">
               <a href="/leads" class="rounded-lg px-4 py-2 text-sm text-azul-oscuro hover:bg-(--is-bg-secondary)">Cancelar</a>
               <Button type="submit" class="w-auto! px-5!" loading={bGuardando}>
                  <Iconify icon="mdi:content-save-outline" slot="icon" />
                  Guardar
               </Button>
            </div>
         </div>
      </form>

      {#if bShowEliminar}
         <ModalEliminar {Controller} {Obj} bind:bshow={bShowEliminar} postSubmit={alEliminar} onError={avisarError}>
            <Text slot="descripcion" color="neutral" class="text-sm">
               Esta acción no se puede deshacer. Si el lead tiene mensajes registrados, no se podrá eliminar.
            </Text>
         </ModalEliminar>
      {/if}
      {#if bShowDuplicar}
         <ModalDuplicar {Controller} {Obj} bind:bshow={bShowDuplicar} postSubmit={alDuplicar} onError={avisarError}>
            <Text color="neutral" class="text-sm">La copia lleva los datos y los correos del lead; los mensajes se quedan en el original.</Text>
         </ModalDuplicar>
      {/if}
      {#if bShowRecodificar}
         <ModalRecodificar {Controller} {Obj} bind:bshow={bShowRecodificar} postSubmit={alRecodificar} onError={avisarError}>
            <Text color="neutral" class="text-sm">El lead conserva sus correos y mensajes con el nuevo código.</Text>
         </ModalRecodificar>
      {/if}
   {/if}
</section>
