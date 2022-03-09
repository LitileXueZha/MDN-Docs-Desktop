function $(query: string) {
    return document.querySelector(query);
}

$.id = (elementId: string) => document.getElementById(elementId);
$.class = (classNames: string) => document.getElementsByClassName(classNames);
$.all = (query: string) => document.querySelectorAll(query);

export default $;
