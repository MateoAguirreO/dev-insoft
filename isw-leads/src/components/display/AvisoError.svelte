<script context="module" lang="ts">
   import type { HTMLAttributes } from "svelte/elements";

   export interface TAvisoErrorProps extends HTMLAttributes<HTMLDivElement> {
      mensaje: string;
      onReintentar?: () => unknown;
   }
</script>

<script lang="ts">
   import { Button, Iconify, Text } from "@ingenieria_insoft/ispsveltecomponents";

   interface $$Props extends TAvisoErrorProps {}

   export let mensaje: $$Props["mensaje"] = "";
   export let onReintentar: $$Props["onReintentar"] = undefined;
</script>

<!-- Estado de error amable: qué pasó en palabras simples y, si aplica, cómo volver a intentarlo -->
<div
   role="alert"
   class="flex flex-col items-center gap-3 rounded-lg border border-(--is-b-color) bg-(--is-bg-secondary) p-6 text-center {$$props.class ?? ''}"
   style={$$props.style ?? ""}
>
   <Iconify icon="mdi:cloud-alert-outline" class="text-3xl text-(--is-error)" />
   <Text>{mensaje}</Text>
   {#if onReintentar}
      <Button variant="outlined" onClick={onReintentar} class="w-auto! px-4!">
         <Iconify icon="mdi:refresh" slot="icon" />
         Reintentar
      </Button>
   {/if}
</div>
