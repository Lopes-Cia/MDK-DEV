"use client";

import type { Config } from "@puckeditor/core";

import { CepMockFormBlock } from "@/components/puck/blocks/cep-mock-form";
import { CategoryChipsBlock } from "@/components/puck/blocks/category-chips";
import { HeroBlock } from "@/components/puck/blocks/hero";
import { ProductGridBlock } from "@/components/puck/blocks/product-grid";
import { PromoBannerBlock } from "@/components/puck/blocks/promo-banner";

export const puckConfig: Config = {
  components: {
    Hero: {
      fields: {
        title: { type: "text" },
        subtitle: { type: "text" },
      },
      defaultProps: {
        title: "Título",
        subtitle: "",
      },
      render: ({ title, subtitle }) => <HeroBlock title={title} subtitle={subtitle} />,
    },
    PromoBanner: {
      fields: {
        text: { type: "text" },
        variant: {
          type: "select",
          options: [
            { label: "Hot", value: "hot" },
            { label: "Soft", value: "soft" },
          ],
        },
      },
      defaultProps: {
        text: "Promoções do dia",
        variant: "soft",
      },
      render: ({ text, variant }) => <PromoBannerBlock text={text} variant={variant} />,
    },
    ComboCarousel: {
      fields: {
        title: { type: "text" },
        limit: { type: "number" },
      },
      defaultProps: {
        title: "Combos",
        limit: 10,
      },
      render: ({ title, limit }) => <ProductGridBlock title={title} limit={limit} />,
    },
    ProductCarousel: {
      fields: {
        title: { type: "text" },
        limit: { type: "number" },
      },
      defaultProps: {
        title: "Produtos",
        limit: 10,
      },
      render: ({ title, limit }) => <ProductGridBlock title={title} limit={limit} />,
    },
    CategoryGrid: {
      fields: {
        title: { type: "text" },
        limit: { type: "number" },
      },
      defaultProps: {
        title: "Categorias",
        limit: 12,
      },
      render: ({ title, limit }) => <CategoryChipsBlock title={title} limit={limit} />,
    },
    CategoryChips: {
      fields: {
        title: { type: "text" },
        limit: { type: "number" },
      },
      defaultProps: {
        title: "Categorias",
        limit: 12,
      },
      render: ({ title, limit }) => <CategoryChipsBlock title={title} limit={limit} />,
    },
    ProductGrid: {
      fields: {
        title: { type: "text" },
        limit: { type: "number" },
      },
      defaultProps: {
        title: "Produtos",
        limit: 10,
      },
      render: ({ title, limit }) => <ProductGridBlock title={title} limit={limit} />,
    },
    CepMockForm: {
      fields: {
        label: { type: "text" },
        helper: { type: "text" },
      },
      defaultProps: {
        label: "CEP",
        helper: "",
      },
      render: ({ label, helper }) => <CepMockFormBlock label={label} helper={helper} />,
    },
  },
};

