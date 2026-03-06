import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RippleModule } from 'primeng/ripple';
import { StyleClassModule } from 'primeng/styleclass';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TimelineModule } from 'primeng/timeline';
import { CardModule } from 'primeng/card';
import { TopbarWidget } from './components/topbarwidget.component';
import { HeroWidget } from './components/herowidget';
import { FeaturesWidget } from './components/featureswidget';
import { HighlightsWidget } from './components/highlightswidget';
import { PricingWidget } from './components/pricingwidget';
import { FooterWidget } from './components/footerwidget';
import { RoadmapWidget } from './components/roadmap';
import { CommonModule } from '@angular/common';
import { TestimonialsWidget } from './components/testimonials';
import { BecomeCoachComponent } from './components/become-a-coach';
import { ScrollToTopComponent } from './components/ScrollToTopComponent';
import { MarketingLandingCardsComponent } from './components/marketing-landing-cards';
import { StatComponent } from './components/stat';
import { CareerCardsComponent } from './components/CareerCards';
import { WhyRedBoostComponent } from './components/WhyRedBoost';
import { CallToActionComponent } from './components/CallToAction';
import { QuotesWidget } from './components/QuotesWidget';
import { FaqComponent } from './components/faq.component';

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [
        RouterModule,
        TopbarWidget,
        HeroWidget,
        StatComponent,
        CareerCardsComponent,
        WhyRedBoostComponent,
        CallToActionComponent,
        // FeaturesWidget,
        HighlightsWidget,
        PricingWidget,
        MarketingLandingCardsComponent,
        FooterWidget,
        RippleModule,
        StyleClassModule,
        ButtonModule,
        DividerModule,
        RoadmapWidget,
        QuotesWidget,
        FaqComponent,
        TimelineModule,
        CardModule,
        CommonModule,
        TestimonialsWidget,
        BecomeCoachComponent,
        ScrollToTopComponent,
    ],
    template: `
        <div class="dark:bg-surface-900 min-h-screen">
            <div id="home" class="landing-wrapper overflow-hidden">
                <topbar-widget />
                <app-hero-widget />
                <app-stat />
                <app-why-redboost />
                <highlights-widget />
                <app-call-to-action />
                <roadmap-widget />
                <app-become-a-coach />
                <quotes-widget />
                <pricing-widget />
                <app-marketing-landing-cards />
                <app-faq />
                <footer-widget />
                <app-scroll-to-top />
            </div>
        </div>
    `,
})
export class Landing {}
