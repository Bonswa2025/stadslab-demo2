'use client';
import { useEffect } from 'react';
const urlFor=(id:string)=> `/manuals#/truck/${id}`;
export default function SeedData(){
  useEffect(()=>{
    try{
      if(localStorage.getItem('sl:seeded')) return;
      localStorage.setItem('stadslab_event_name', JSON.stringify('Demo Event – Vrijdag'));
      localStorage.setItem('stadslab_concepts_v2', JSON.stringify([
        {id:'concept-gemaal', name:'Gemaal', howToUrl:urlFor('gemaal')},
        {id:'concept-pinsa', name:'Pinsa (pizza)', howToUrl:urlFor('pizza_electric')},
        {id:'concept-storm', name:'Stormbar', howToUrl:urlFor('storm')},
      ]));
      localStorage.setItem('stadslab_event_instances_v4', JSON.stringify([
        {person:'Jan', conceptId:'concept-gemaal'},
        {person:'Sara', conceptId:'concept-pinsa'},
        {person:'Mo', conceptId:'concept-storm'},
      ]));
      localStorage.setItem('sl:seeded','1');
    }catch{}
  },[]);
  return null;
}
