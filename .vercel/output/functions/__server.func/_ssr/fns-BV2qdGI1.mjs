import { f as spriteUrl, t as CATALOG } from "./catalog-Wwq4LA80.mjs";
import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
import { a as object, i as number, n as array, o as string, t as _enum } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/fns-BV2qdGI1.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var getPokemonFn_createServerFn_handler = createServerRpc({
	id: "e33781ec4214bf2d60fb339dfe6410f511a1fa9466943886227dfd126fe3b9bd",
	name: "getPokemonFn",
	filename: "src/lib/pokemon/fns.ts"
}, (opts) => getPokemonFn.__executeServer(opts));
var getPokemonFn = createServerFn({ method: "GET" }).validator(object({ q: string().min(1).max(48) })).handler(getPokemonFn_createServerFn_handler, async ({ data }) => {
	const { loadPokemon } = await import("./pokeapi.server-DqiR_w8a.mjs");
	return loadPokemon(data.q);
});
var getQuizFn_createServerFn_handler = createServerRpc({
	id: "7c741528990a5ceeaea2612cce5f9905baeff8a0b9400150d95239bcc1377fe8",
	name: "getQuizFn",
	filename: "src/lib/pokemon/fns.ts"
}, (opts) => getQuizFn.__executeServer(opts));
var getQuizFn = createServerFn({ method: "GET" }).handler(getQuizFn_createServerFn_handler, async () => {
	const id = Math.floor(Math.random() * CATALOG.length) + 1;
	const entry = CATALOG.find((p) => p.id === id) ?? CATALOG[0];
	const pool = CATALOG.filter((p) => p.id !== entry.id);
	const distractors = [];
	while (distractors.length < 3 && pool.length > 0) {
		const i = Math.floor(Math.random() * pool.length);
		distractors.push(pool.splice(i, 1)[0]);
	}
	const mixed = [entry, ...distractors];
	for (let i = mixed.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[mixed[i], mixed[j]] = [mixed[j], mixed[i]];
	}
	return {
		id: entry.id,
		name: entry.name,
		nameEs: entry.nameEs,
		types: entry.types,
		sprite: spriteUrl(entry.id),
		options: mixed.map((p) => ({
			id: p.id,
			nameEs: p.nameEs
		}))
	};
});
var askSchema = object({
	mode: _enum([
		"chat",
		"hint",
		"analyze"
	]),
	question: string().max(280).optional(),
	pokemon: object({
		id: number().int().min(1).max(151),
		nameEs: string(),
		types: array(string()),
		description: string().optional(),
		stats: array(object({
			name: string(),
			base: number()
		})).optional(),
		abilities: array(object({ nameEs: string() })).optional()
	}).optional()
});
var askDexFn_createServerFn_handler = createServerRpc({
	id: "f3c5120a23c69dbbfee57f830421c681286a619b0caa1a8de04c5ae15f56bb4b",
	name: "askDexFn",
	filename: "src/lib/pokemon/fns.ts"
}, (opts) => askDexFn.__executeServer(opts));
var askDexFn = createServerFn({ method: "POST" }).validator(askSchema).handler(askDexFn_createServerFn_handler, async ({ data }) => {
	const { askDex } = await import("./ai.server-BMyWXU6e.mjs");
	return askDex(data);
});
//#endregion
export { askDexFn_createServerFn_handler, getPokemonFn_createServerFn_handler, getQuizFn_createServerFn_handler };
