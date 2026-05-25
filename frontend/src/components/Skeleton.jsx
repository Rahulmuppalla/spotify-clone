import React from 'react';

export const SongCardSkeleton = () => {
  return (
    <div className="bg-spotify-lightdark p-4 rounded-lg flex flex-col gap-4 animate-pulse w-full">
      <div className="aspect-square w-full bg-zinc-800 rounded-md"></div>
      <div className="flex flex-col gap-2">
        <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
        <div className="h-3 bg-zinc-800 rounded w-1/2"></div>
      </div>
    </div>
  );
};

export const SongRowSkeleton = () => {
  return (
    <div className="flex items-center justify-between p-2 rounded-md animate-pulse">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-10 h-10 bg-zinc-800 rounded shrink-0"></div>
        <div className="flex flex-col gap-2 flex-1 max-w-[150px]">
          <div className="h-3.5 bg-zinc-800 rounded w-full"></div>
          <div className="h-2.5 bg-zinc-800 rounded w-2/3"></div>
        </div>
      </div>
      <div className="w-24 h-3.5 bg-zinc-800 rounded hidden md:block"></div>
      <div className="w-8 h-8 bg-zinc-800 rounded-full ml-4"></div>
    </div>
  );
};

export const GridSkeleton = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SongCardSkeleton key={i} />
      ))}
    </div>
  );
};

export const ListSkeleton = ({ count = 5 }) => {
  return (
    <div className="flex flex-col gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <SongRowSkeleton key={i} />
      ))}
    </div>
  );
};
