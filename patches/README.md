# Renderer serialization patch

`react-render-to-markdown@19.1.0.patch` backports the optional resolved-node
serializer API from https://github.com/SoonIter/react-render-to-markdown/pull/13.
It keeps the published renderer's existing SSR implementation and default
Markdown behavior. The ESM entry, CommonJS entry, and public types expose the same
API. Only Rspress's SSG-MD entry opts into the new serializers.

Replace this patch with a released renderer dependency containing that API
before merging the Rspress change. Keeping the patch in the draft makes clean
installs and CI independently reproducible while the upstream API is reviewed.
