/** JSON for a <script type="application/ld+json"> block, with '<' escaped so no value can close the tag. */
export const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c')
