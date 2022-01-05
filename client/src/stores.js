import { writable } from 'svelte/store';

export const socket = writable()
export const User = writable({loggedIn: false, username: ''});
export const LoreIpsum = writable(
    `Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren,`
    );
export let verse = writable('')
export const bible = writable({})